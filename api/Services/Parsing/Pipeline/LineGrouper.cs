using Resumade.Api.Services.Parsing.Primitives;

namespace Resumade.Api.Services.Parsing.Pipeline
{
    internal static class LineGrouper
    {
        private static readonly HashSet<char> EndTriggers = [':', ',', '|', '.'];
        private static readonly HashSet<char> BulletPoints = ['⋅', '∙', '•', '⦁', '⚫', '●', '⬤', '⚬', '○', '▪', '◦', '‣', '–'];

        public static List<Line> GroupTextToLines(IReadOnlyList<TextItem> textItems)
        {
            ArgumentNullException.ThrowIfNull(textItems);

            var lines = SplitAtLineEndings(textItems);
            double commonCharWidth = GetCommonCharWidth(textItems);

            foreach (var line in lines)
            {
                MergeAdjacentItems(line.Items, commonCharWidth);
            }

            return lines;
        }

        private static List<Line> SplitAtLineEndings(
            IReadOnlyList<TextItem> textItems)
        {
            var lines = new List<Line>();
            var currentLine = new List<TextItem>();

            foreach (var item in textItems)
            {
                if (item.HasEOL)
                {
                    if (!string.IsNullOrWhiteSpace(item.Text))
                    {
                        currentLine.Add(item);
                    }
                    lines.Add(new Line(currentLine.ToList()));
                    currentLine.Clear();
                }
                else if (!string.IsNullOrWhiteSpace(item.Text))
                {
                    currentLine.Add(item);
                }
            }

            // Preserve the final line even without an EOL marker.
            if (currentLine.Count > 0)
            {
                lines.Add(new Line(currentLine));
            }

            return lines;
        }

        private static void MergeAdjacentItems(
            List<TextItem> items,
            double typicalCharWidth)
        {
            if (items.Count < 2 || !double.IsFinite(typicalCharWidth) || typicalCharWidth <= 0)
                return;

            const double MaxJoinGap = 1.0;
            const double MaxOverlap = 0.5;

            // Work backwards so removing an item doesn't skip another pair.
            for (int i = items.Count - 1; i > 0; i--)
            {
                var left = items[i - 1];
                var right = items[i];

                double gap = right.X - (left.X + left.Width);

                if (gap > typicalCharWidth * MaxJoinGap || gap < -typicalCharWidth * MaxOverlap) continue;

                if (gap <= typicalCharWidth)
                {
                    string separator =
                        NeedSpacing(left.Text, right.Text, gap > typicalCharWidth * 0.2) ? " " : "";

                    items[i - 1] = left with
                    {
                        Text = left.Text + separator + right.Text,
                        Width = right.X + right.Width - left.X
                    };

                    items.RemoveAt(i);
                }
            }
        }

        private static bool NeedSpacing(
            string leftText,
            string rightText,
            bool hasWordGap)
        {
            if (string.IsNullOrEmpty(leftText) || string.IsNullOrEmpty(rightText))
                return false;

            char leftEnd = leftText[^1];
            char rightStart = rightText[0];


            // Condition 1: Left ends with punctuation/bullet and right doesn't start with a space
            bool condition1 = (EndTriggers.Contains(leftEnd) || BulletPoints.Contains(leftEnd)) && rightStart != ' ';

            // Condition 2: Left doesn't end with a space and right starts with '|' or a bullet
            bool condition2 = leftEnd != ' ' && BulletPoints.Contains(rightStart);

            bool betweenWords = hasWordGap && char.IsLetterOrDigit(leftEnd) && char.IsLetterOrDigit(rightStart);
            return condition1 || condition2 || betweenWords;
        }

        private static double GetCommonCharWidth(
            IReadOnlyList<TextItem> textItems)
        {
            var heightCounts = new Dictionary<double, int>();
            var fontCounts = new Dictionary<string, int>();

            double commonHeight = 0;
            string commonFont = "";

            int maxHeightCount = 0;
            int maxFontCount = 0;

            foreach (var item in textItems)
            {
                if (string.IsNullOrWhiteSpace(item.Text))
                    continue;

                // Text item's height frequency counts.
                int heightCount =
                    heightCounts.GetValueOrDefault(item.Height) + 1;

                heightCounts[item.Height] = heightCount;

                if (heightCount > maxHeightCount)
                {
                    maxHeightCount = heightCount;
                    commonHeight = item.Height;
                }

                // Font frequency counts characters, not text items.
                int fontCount =
                    fontCounts.GetValueOrDefault(item.FontName)
                    + item.Text.Length;

                fontCounts[item.FontName] = fontCount;

                if (fontCount > maxFontCount)
                {
                    maxFontCount = fontCount;
                    commonFont = item.FontName;
                }
            }

            double totalWidth = 0;
            int totalCharacters = 0;

            // Sum up the width and length of text with common font
            foreach (var item in textItems)
            {
                if (string.IsNullOrWhiteSpace(item.Text))
                    continue;

                if (item.Height == commonHeight
                    && item.FontName == commonFont)
                {
                    totalWidth += item.Width;
                    totalCharacters += item.Text.Length;
                }
            }

            return totalCharacters > 0 ? totalWidth / totalCharacters : 0;
        }
    }
}
