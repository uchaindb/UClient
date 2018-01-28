namespace Frontend.Controllers
{
    using Frontend.Models;
    using Microsoft.AspNetCore.Hosting;
    using Microsoft.AspNetCore.Http;
    using Microsoft.AspNetCore.Http.Features;
    using Microsoft.AspNetCore.NodeServices;
    using Microsoft.AspNetCore.SpaServices.Prerendering;
    using Microsoft.Extensions.Options;
    using System.IO;
    using System.Threading;
    using System.Threading.Tasks;
    using System;
    using System.Net;

    public class PrerenderHelper
    {
        internal const string UrlPrefix = "prerender/";
        internal const string GeneratedPath = "prerendered/";
        private AppSettings appSettings;
        private IHostingEnvironment env;
        private INodeServices nodeServices;
        private ISpaPrerenderer prerenderer;

        public PrerenderHelper(IOptions<AppSettings> appSettings, IHostingEnvironment env, INodeServices nodeServices, ISpaPrerenderer prerenderer)
        {
            this.appSettings = appSettings.Value;
            this.env = env;
            this.nodeServices = nodeServices;
            this.prerenderer = prerenderer;
        }

        public async Task<PrerenderStatus> Prerender(HttpContext httpContext)
        {
            var expired = this.IsFileCacheExpired(httpContext);
            if (!expired) return PrerenderStatus.CacheNotExpired;

            var basePath = env.ContentRootPath;
            var moduleName = "ClientApp/dist/main-server";
            string exportName = null;
            var customDataParameter = new { apiBaseUrl = this.appSettings.ApiBaseUrl };
            var timeoutMilliseconds = default(int);

            var requestFeature = httpContext.Features.Get<IHttpRequestFeature>();
            var unencodedPathAndQuery = requestFeature.RawTarget.Replace(UrlPrefix, "");

            var request = httpContext.Request;
            var unencodedAbsoluteUrl = $"{request.Scheme}://{request.Host}{unencodedPathAndQuery}".Replace(UrlPrefix, "");

            var result = await Prerenderer.RenderToString(
                basePath,
                nodeServices,
                CancellationToken.None,
                new JavaScriptModuleExport(moduleName) { ExportName = exportName },
                unencodedAbsoluteUrl,
                unencodedPathAndQuery,
                customDataParameter,
                timeoutMilliseconds,
                httpContext.Request.PathBase.ToString());

            async void WriteFile(string content, string extension)
            {
                var file = new FileInfo(this.GetCacheBaseFilePath(httpContext) + "." + extension);
                if (!file.Directory.Exists) file.Directory.Create();
                if (string.IsNullOrEmpty(content) && file.Exists) file.Delete();
                if (string.IsNullOrEmpty(content)) return;
                await File.WriteAllTextAsync(file.FullName, content);
            }

            var html = result.Html;
            WriteFile(html, "html");
            var script = result.CreateGlobalsAssignmentScript();
            WriteFile(script, "js");

            return PrerenderStatus.Prerendered;
        }

        private bool IsFileCacheExpired(HttpContext httpContext)
        {
            var htmlFile = new FileInfo(this.GetCacheBaseFilePath(httpContext) + ".html");

            return !htmlFile.Exists || (DateTime.Now - htmlFile.LastWriteTime).TotalSeconds > this.appSettings.MinPrerenderIntervalSeconds;
        }

        private string GetCacheBaseFilePath(HttpContext httpContext)
        {
            var basePath = env.ContentRootPath;
            var requestFeature = httpContext.Features.Get<IHttpRequestFeature>();
            var unencodedPathAndQuery = requestFeature.RawTarget.Replace(UrlPrefix, "");
            return Path.Combine(basePath, GeneratedPath, WebUtility.UrlEncode(unencodedPathAndQuery).Replace("*", "_"));
        }

        public enum PrerenderStatus
        {
            Prerendered,
            CacheNotExpired,
            Error,
        }
    }
}