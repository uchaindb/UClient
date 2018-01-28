using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Frontend.Models;
using Microsoft.Extensions.Options;
using System.Reflection;
using Microsoft.AspNetCore.Cors;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.Extensions;
using Microsoft.AspNetCore.Http.Features;
using System.IO;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Logging;
using System.Net;
using System.Text.RegularExpressions;

namespace Frontend.Controllers
{
    public class HomeController : Controller
    {
        private AppSettings appSettings;
        private IHostingEnvironment env;
        private PrerenderHelper prerenderHelper;
        private ILogger logger;

        public HomeController(IOptions<AppSettings> appSettings, IHostingEnvironment env, PrerenderHelper prerenderHelper, ILogger<HomeController> logger)
        {
            this.appSettings = appSettings.Value;
            this.env = env;
            this.prerenderHelper = prerenderHelper;
            this.logger = logger;
        }

        public async Task<IActionResult> Index()
        {
            string html = null, js = null, title = null;
            try
            {
                var requestFeature = HttpContext.Features.Get<IHttpRequestFeature>();
                var unencodedPathAndQuery = requestFeature.RawTarget;
                var basePath = Path.Combine(env.ContentRootPath, PrerenderHelper.GeneratedPath, WebUtility.UrlEncode(unencodedPathAndQuery).Replace("*", "_"));
                // avoid file name too long exception
                if (basePath.Length < 250)
                {
                    var htmlFile = new FileInfo(basePath + ".html");
                    var jsFile = new FileInfo(basePath + ".js");

                    if (htmlFile.Exists && (DateTime.Now - htmlFile.LastWriteTime).TotalSeconds < this.appSettings.MaxFileCacheValidSeconds)
                    {
                        html = await System.IO.File.ReadAllTextAsync(htmlFile.FullName);
                        if (jsFile.Exists) js = await System.IO.File.ReadAllTextAsync(jsFile.FullName);
                    }
                }

                if (!string.IsNullOrEmpty(html))
                {
                    var match = Regex.Match(html, "<title>(?<title>.*)</title>");
                    title = match.Success ? match.Groups["title"].Value : null;
                }
            }
            catch (Exception ex)
            {
                logger.LogWarning(new EventId(-1), ex, "failed to get generated file");
            }

            ViewData["Title"] = title;
            ViewData["PrerenderedHtml"] = html;
            ViewData["PrerenderedGlobals"] = js;
            ViewBag.Prerender = false;
            ViewBag.ApiBaseUrl = this.appSettings.ApiBaseUrl;
            return View();
        }

        //public IActionResult Prerender()
        //{
        //    ViewBag.Prerender = true;
        //    ViewBag.ApiBaseUrl = this.appSettings.ApiBaseUrl;
        //    return View(nameof(Index));
        //}

        public IActionResult Error()
        {
            return View(new ErrorViewModel { RequestId = Activity.Current?.Id ?? HttpContext.TraceIdentifier });
        }

        [EnableCors("AllowAllOrigins")]
        public IActionResult Version()
        {
            var fileVersion = typeof(Startup)
                .GetTypeInfo()
                .Assembly
                .GetCustomAttribute<AssemblyFileVersionAttribute>()
                .Version;
            return this.Ok(fileVersion);
        }

        public async Task<IActionResult> Prerender([FromHeader]string authorization)
        {
            if (authorization != this.appSettings.AuthCode) return StatusCode(403);

            var ret = await this.prerenderHelper.Prerender(HttpContext);
            return this.Ok(new { result = ret.ToString() });
        }
    }
}
