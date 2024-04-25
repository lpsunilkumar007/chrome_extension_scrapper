using HtmlAgilityPack;

namespace ScrapperExtention.Services
{
    public class RealEstateScraper
    {




        public static async System.Threading.Tasks.Task<List<Property>> ScrapePropertiesAsync(string url)
        {
            var properties = new List<Property>();

            using (HttpClient client = new HttpClient())
            {
                var response = await client.GetStringAsync(url);
                var doc = new HtmlDocument();
                doc.LoadHtml(response);

                var propertyNodes = doc.DocumentNode.SelectNodes("//div[contains(@class, 'residential-card')]");

                if (propertyNodes != null)
                {
                    foreach (var node in propertyNodes)
                    {
                        var property = new Property();

                        // Example XPath to fetch address, price, and description
                        var addressNode = node.SelectSingleNode(".//h2[contains(@class, 'residential-card__address')]");
                        var priceNode = node.SelectSingleNode(".//span[contains(@class, 'residential-card__price')]");
                        var descriptionNode = node.SelectSingleNode(".//p[contains(@class, 'residential-card__description')]");

                        property.Address = addressNode?.InnerText?.Trim();
                        property.Price = priceNode?.InnerText?.Trim();
                        property.Description = descriptionNode?.InnerText?.Trim();

                        properties.Add(property);
                    }
                }
            }

            return properties;
        }

    }


    public class Property
    {
        public string Address { get; set; }
        public string Price { get; set; }
        public string Description { get; set; }
    }

}
