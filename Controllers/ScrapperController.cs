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
        public async Task<ActionResult> GetPropperty(string url)
        {
            var dta = await RealEstateScraper.ScrapePropertiesAsync(url);
            // Create a successful response            
            /// var response = new ApiResponse<Dictionary<string, string>>(true,, "Request successful", loginViewModel.Email, loginViewModel.Password);
            return Ok(dta);
        }
    }


}
