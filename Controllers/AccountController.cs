using Microsoft.AspNetCore.Mvc;
using ScrapperExtention.ViewModel;

namespace ScrapperExtention.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AccountController : ControllerBase
    {


        [HttpPost("Login")]
        public async Task<ActionResult> Login(LoginViewModel loginViewModel)
        {
            // Example data
            var data = new Dictionary<string, string>
        {
            { "status", "All systems operational" }
        };

            // Create a successful response
            var response = new ApiResponse<Dictionary<string, string>>(true, data, "Request successful");

            return Ok(response);
        }
    }

    public class LoginViewModel
    {
        public string Email { get; set; }

        public string Password { get; set; }

    }
}
