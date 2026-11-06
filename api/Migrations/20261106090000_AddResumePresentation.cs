using Microsoft.EntityFrameworkCore.Migrations;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Resumade.Api.Data;

#nullable disable

namespace Resumade.Api.Migrations
{
    [DbContext(typeof(ResumadeDbContext))]
    [Migration("20261106090000_AddResumePresentation")]
    public partial class AddResumePresentation : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "PresentationJson",
                table: "Resumes",
                type: "text",
                nullable: true);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "PresentationJson",
                table: "Resumes");
        }
    }
}
