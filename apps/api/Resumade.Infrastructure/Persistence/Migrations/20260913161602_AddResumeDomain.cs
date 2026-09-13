using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Resumade.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddResumeDomain : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "resumes",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_resumes", x => x.Id);
                    table.ForeignKey(
                        name: "FK_resumes_users_UserId",
                        column: x => x.UserId,
                        principalTable: "users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "resume_versions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ResumeId = table.Column<Guid>(type: "uuid", nullable: false),
                    VersionNumber = table.Column<int>(type: "integer", nullable: false),
                    Title = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    ProfessionalSummary = table.Column<string>(type: "character varying(4000)", maxLength: 4000, nullable: true),
                    SourceType = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_resume_versions", x => x.Id);
                    table.CheckConstraint("CK_resume_versions_version_number", "\"VersionNumber\" >= 1");
                    table.ForeignKey(
                        name: "FK_resume_versions_resumes_ResumeId",
                        column: x => x.ResumeId,
                        principalTable: "resumes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "education",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ResumeVersionId = table.Column<Guid>(type: "uuid", nullable: false),
                    Institution = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Degree = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    FieldOfStudy = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    Location = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    StartDate = table.Column<int>(type: "integer", nullable: true),
                    EndDate = table.Column<int>(type: "integer", nullable: true),
                    Description = table.Column<string>(type: "character varying(4000)", maxLength: 4000, nullable: true),
                    SortOrder = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_education", x => x.Id);
                    table.CheckConstraint("CK_education_date_range", "\"StartDate\" IS NULL OR \"EndDate\" IS NULL OR \"EndDate\" >= \"StartDate\"");
                    table.CheckConstraint("CK_education_sort_order", "\"SortOrder\" >= 0");
                    table.ForeignKey(
                        name: "FK_education_resume_versions_ResumeVersionId",
                        column: x => x.ResumeVersionId,
                        principalTable: "resume_versions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "experiences",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ResumeVersionId = table.Column<Guid>(type: "uuid", nullable: false),
                    Company = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Position = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Location = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    StartDate = table.Column<int>(type: "integer", nullable: true),
                    EndDate = table.Column<int>(type: "integer", nullable: true),
                    IsCurrent = table.Column<bool>(type: "boolean", nullable: false),
                    Description = table.Column<string>(type: "character varying(4000)", maxLength: 4000, nullable: true),
                    SortOrder = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_experiences", x => x.Id);
                    table.CheckConstraint("CK_experiences_current_end_date", "NOT \"IsCurrent\" OR \"EndDate\" IS NULL");
                    table.CheckConstraint("CK_experiences_date_range", "\"StartDate\" IS NULL OR \"EndDate\" IS NULL OR \"EndDate\" >= \"StartDate\"");
                    table.CheckConstraint("CK_experiences_sort_order", "\"SortOrder\" >= 0");
                    table.ForeignKey(
                        name: "FK_experiences_resume_versions_ResumeVersionId",
                        column: x => x.ResumeVersionId,
                        principalTable: "resume_versions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "projects",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ResumeVersionId = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Description = table.Column<string>(type: "character varying(4000)", maxLength: 4000, nullable: true),
                    Url = table.Column<string>(type: "character varying(2048)", maxLength: 2048, nullable: true),
                    StartDate = table.Column<int>(type: "integer", nullable: true),
                    EndDate = table.Column<int>(type: "integer", nullable: true),
                    SortOrder = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_projects", x => x.Id);
                    table.CheckConstraint("CK_projects_date_range", "\"StartDate\" IS NULL OR \"EndDate\" IS NULL OR \"EndDate\" >= \"StartDate\"");
                    table.CheckConstraint("CK_projects_sort_order", "\"SortOrder\" >= 0");
                    table.ForeignKey(
                        name: "FK_projects_resume_versions_ResumeVersionId",
                        column: x => x.ResumeVersionId,
                        principalTable: "resume_versions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "skills",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ResumeVersionId = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Category = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    Proficiency = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    YearsExperience = table.Column<decimal>(type: "numeric(4,1)", precision: 4, scale: 1, nullable: true),
                    SortOrder = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_skills", x => x.Id);
                    table.CheckConstraint("CK_skills_sort_order", "\"SortOrder\" >= 0");
                    table.CheckConstraint("CK_skills_years_experience", "\"YearsExperience\" IS NULL OR \"YearsExperience\" >= 0");
                    table.ForeignKey(
                        name: "FK_skills_resume_versions_ResumeVersionId",
                        column: x => x.ResumeVersionId,
                        principalTable: "resume_versions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_education_ResumeVersionId",
                table: "education",
                column: "ResumeVersionId");

            migrationBuilder.CreateIndex(
                name: "IX_experiences_ResumeVersionId",
                table: "experiences",
                column: "ResumeVersionId");

            migrationBuilder.CreateIndex(
                name: "IX_projects_ResumeVersionId",
                table: "projects",
                column: "ResumeVersionId");

            migrationBuilder.CreateIndex(
                name: "IX_resume_versions_ResumeId_VersionNumber",
                table: "resume_versions",
                columns: new[] { "ResumeId", "VersionNumber" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_resumes_UserId",
                table: "resumes",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_skills_ResumeVersionId",
                table: "skills",
                column: "ResumeVersionId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "education");

            migrationBuilder.DropTable(
                name: "experiences");

            migrationBuilder.DropTable(
                name: "projects");

            migrationBuilder.DropTable(
                name: "skills");

            migrationBuilder.DropTable(
                name: "resume_versions");

            migrationBuilder.DropTable(
                name: "resumes");
        }
    }
}
