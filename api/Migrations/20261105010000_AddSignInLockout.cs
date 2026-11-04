using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using Resumade.Api.Data;

#nullable disable

namespace Resumade.Api.Migrations;

[DbContext(typeof(ResumadeDbContext))]
[Migration("20261105010000_AddSignInLockout")]
public partial class AddSignInLockout : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<int>(
            name: "FailedSignInAttempts",
            table: "Users",
            type: "integer",
            nullable: false,
            defaultValue: 0);

        migrationBuilder.AddColumn<DateTime>(
            name: "LockoutEndUtc",
            table: "Users",
            type: "timestamp with time zone",
            nullable: true);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropColumn(name: "FailedSignInAttempts", table: "Users");
        migrationBuilder.DropColumn(name: "LockoutEndUtc", table: "Users");
    }
}
