namespace Frontend.Models
{
    public class AppSettings
    {
        public string ApiBaseUrl { get; set; }
        public string AuthCode { get; set; }
        public int MaxFileCacheValidSeconds { get; set; }
        public int MinPrerenderIntervalSeconds { get; set; }
    }
}