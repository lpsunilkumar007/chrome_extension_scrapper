using ScrapperExtention.Controllers;

namespace ScrapperExtention.ViewModel
{
    public class ApiResponse<T>
    {
        public bool Success { get; set; }
        public T Result { get; set; }
        public string Message { get; set; }
        public ApiResponse(bool success, T result, string message = "",string email="",string password = "")
        {
            if (email == "admin@extension.com" && password == "Admin#321") 
            {
                Success = true;
                Result = result;
                Message = "Login SuccessFully";
            }
            else
            {
                Success = false;
                Result = result;
                Message = "Invalid Login";
            }
        }
    }

}
