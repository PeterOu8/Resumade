using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Resumade.Api.Migrations
{
    /// <inheritdoc />
    public partial class SimplifyResume : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsPrimary",
                table: "Resumes");

            migrationBuilder.DropColumn(
                name: "Style",
                table: "Resumes");

            migrationBuilder.DropColumn(
                name: "ThemeColor",
                table: "Resumes");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsPrimary",
                table: "Resumes",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "Style",
                table: "Resumes",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "ThemeColor",
                table: "Resumes",
                type: "text",
                nullable: false,
                defaultValue: "");
        }
    }
}
