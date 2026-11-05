using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Resumade.Api.Migrations
{
    /// <inheritdoc />
    public partial class IndexResumePagination : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Resumes_UserId",
                table: "Resumes");

            migrationBuilder.CreateIndex(
                name: "IX_Resumes_UserId_UpdatedAt_Id",
                table: "Resumes",
                columns: new[] { "UserId", "UpdatedAt", "Id" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Resumes_UserId_UpdatedAt_Id",
                table: "Resumes");

            migrationBuilder.CreateIndex(
                name: "IX_Resumes_UserId",
                table: "Resumes",
                column: "UserId");
        }
    }
}
