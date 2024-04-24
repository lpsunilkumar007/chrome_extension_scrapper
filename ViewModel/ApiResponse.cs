namespace ScrapperExtention.ViewModel
{
    public class ApiResponse<T>
    {
        public bool Success { get; set; }
        public T Result { get; set; }
        public string Message { get; set; }

        public ApiResponse(bool success, T result, string message = "")
        {
            Success = success;
            Result = result;
            Message = message;
        }
    }

}
