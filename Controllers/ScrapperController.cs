using Microsoft.AspNetCore.Mvc;
using ScrapperExtention.Services;
using ScrapperExtention.ViewModel;

namespace ScrapperExtention.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ScrapperController : ControllerBase
    {
        [HttpGet("GetPropperty")]
        public async Task<ActionResult> GetPropperty(string scrapUrl)
        {
            var dta = await RealEstateScraper.ScraperPropertiesAsync(scrapUrl);
            return Ok(dta);
        }
    }
}
