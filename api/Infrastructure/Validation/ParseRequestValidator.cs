using Resumade.Api.Dtos.Parsing;

namespace Resumade.Api.Infrastructure.Validation
{
    internal static class ParseRequestValidator
    {
        private const int MaxItems = 50_000;
        private const int MaxTextLength = 10_000;
        private const int MaxFontNameLength = 256;

        public static string? Validate(
            IReadOnlyList<TextItemDto>? items)
        {
            if (items is null || items.Count == 0)
                return "No text items provided.";

            if (items.Count > MaxItems)
                return "Too many text items.";

            for (int i = 0; i < items.Count; i++)
            {
                var item = items[i];

                if (item is null)
                    return $"TextItem[{i}] is null.";

                if (item.Text is null ||
                    item.Text.Length > MaxTextLength)
                    return $"TextItem[{i}] has invalid text.";

                if (item.X is not double x ||
                    !double.IsFinite(x) ||
                    item.Y is not double y ||
                    !double.IsFinite(y))
                    return $"TextItem[{i}] has invalid coordinates.";

                if (item.Width is not double width ||
                    !double.IsFinite(width) ||
                    width < 0 ||
                    item.Height is not double height ||
                    !double.IsFinite(height) ||
                    height < 0)
                    return $"TextItem[{i}] has invalid dimensions.";

                if (item.FontName?.Length > MaxFontNameLength)
                    return $"TextItem[{i}] has invalid font name.";

                if (item.HasEOL is null)
                    return $"TextItem[{i}] is missing HasEOL.";
            }

            return null;
        }
    }
}
