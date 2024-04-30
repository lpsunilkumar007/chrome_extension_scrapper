using HtmlAgilityPack;

namespace ScrapperExtention.Services
{
    public class RealEstateScraper
    {
        public static async System.Threading.Tasks.Task<Property> ScraperPropertiesAsync(string url)
        {
            var model = new Property();
            try
            {
                using (HttpClient client = new HttpClient())
                {
                    var response = await client.GetStringAsync(url);
                    var doc = new HtmlDocument();
                    doc.LoadHtml(response);
                    #region details                   
                    var details = doc.DocumentNode.SelectSingleNode("//*[@id='details']");
                    if (details != null)
                    {
                        var childNodes = details.ChildNodes;
                        var images = details.SelectSingleNode("//div[contains(@class, 'mb-ldp__dtls__photo__fig')]");
                        var child = images.ChildNodes[0];
                        model.Image = child.Attributes["src"].Value;
                        var ulnode = details.SelectSingleNode("//ul[contains(@class, 'mb-ldp__dtls__body__list')]");
                        foreach (var li in ulnode.ChildNodes.ToList())
                        {
                            bool lable = false;
                            foreach (var liItems in li.ChildNodes.ToList())
                            {
                                if (lable) continue;
                                var ll = liItems.InnerText.Trim();
                                var value = liItems.NextSibling.InnerText.Trim();
                                switch (ll)
                                {
                                    case "Super Built-up Area":
                                        model.SuperBuiltArea = value;
                                        break;
                                    case "Developer":
                                        model.Developer = value;
                                        break;
                                    case "Project":
                                        model.Project = value;
                                        break;
                                    case "Floor":
                                        model.Floor = value;
                                        break;
                                    case "Transaction type":
                                        model.TransactionType = value;
                                        break;
                                    case "Additional Rooms":
                                        model.AdditionalRooms = value;
                                        break;
                                    case "Facing":
                                        model.Facing = value;
                                        break;
                                    case "Lifts":
                                        model.Lifts = value;
                                        break;
                                    case "Furnished Status":
                                        model.FurnishedStatus = value;
                                        break;
                                    default:
                                        break;
                                }
                                lable = true;
                            }
                        }
                    }
                    #endregion

                    #region more detail
                    var propertyNodes = doc.DocumentNode.SelectSingleNode("//*[@id='more-details']");
                    if (propertyNodes != null)
                    {
                        var childNodes = propertyNodes.ChildNodes;

                        var ulnode = propertyNodes.SelectSingleNode("//ul[contains(@class, 'mb-ldp__more-dtl__list')]");
                        foreach (var li in ulnode.ChildNodes.ToList())
                        {

                            bool lable = false;
                            foreach (var liItems in li.ChildNodes.ToList())
                            {
                                if (lable) continue;
                                var lableText = liItems.InnerText.Trim();
                                var value = liItems.NextSibling.InnerText.Trim();
                                switch (lableText)
                                {
                                    case "Price Breakup":
                                        model.Price = value;
                                        break;
                                    case "Booking Amount":
                                        model.BookingAmount = value;
                                        break;
                                    case "Address":
                                        model.Address = value;
                                        break;
                                    case "Landmarks":
                                        model.Landmarks = value;
                                        break;
                                    case "Furnishing":
                                        model.Furnishing = value;
                                        break;
                                    case "Flooring":
                                        model.Flooring = value;
                                        break;
                                    case "Loan Offered":
                                        model.LoanOffered = value;
                                        break;
                                    default:
                                        break;
                                }
                                lable = true;
                            }
                        }
                        var descriptionNode = propertyNodes.SelectSingleNode(".//p");
                        model.Description = descriptionNode?.InnerText?.Trim();
                    }
                    #endregion
                }
            }
            catch (Exception e)
            {
                throw e;
            }
            return model;
        }
    }

    public class Property
    {
        public string Address { get; set; }
        public string Price { get; set; }
        public string BookingAmount { get; set; }
        public string Landmarks { get; set; }
        public string Furnishing { get; set; }
        public string Flooring { get; set; }
        public string LoanOffered { get; set; }
        public string Description { get; set; }
        public string SuperBuiltArea { get; set; }
        public string Developer { get; set; }
        public string Project { get; set; }
        public string Floor { get; set; }
        public string TransactionType { get; set; }
        public string AdditionalRooms { get; set; }
        public string Facing { get; set; }
        public string Lifts { get; set; }
        public string FurnishedStatus { get; set; }
        public string Image { get; set; }
    }

}
