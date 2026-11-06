using System.Text.Encodings.Web;

namespace Resumade.Api.Services.Auth;

internal static class AccountEmailTemplates
{
    public static string AccountAction(
        string heading,
        string instructions,
        string actionUrl,
        string notice)
    {
        var safeHeading = HtmlEncoder.Default.Encode(heading);
        var safeInstructions = HtmlEncoder.Default.Encode(instructions);
        var safeUrl = HtmlEncoder.Default.Encode(actionUrl);
        var safeNotice = HtmlEncoder.Default.Encode(notice);

        return $$"""
        <!doctype html>
        <html lang="en-AU">
        <head><meta name="viewport" content="width=device-width, initial-scale=1"></head>
        <body style="margin:0;background:#faf9f6;font-family:Geist,'Segoe UI',Arial,sans-serif;color:#1e2636;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
                 style="background:#faf9f6;">
            <tr>
              <td align="center" style="padding:32px 16px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
                       style="max-width:640px;background:#ffffff;border:1px solid #dce2ec;border-spacing:0;border-radius:20px;">
                  <tr>
                    <td bgcolor="#1d273b" style="padding:24px 6%;background:#1d273b;color:#ffffff;border-radius:19px 19px 0 0;border-bottom:4px solid #3558c8;">
                      <span style="font-size:25px;line-height:32px;font-weight:700;letter-spacing:-1px;">Resumade</span>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:40px 6%;">

                      <h1 style="margin:0 0 18px;color:#273348;font-size:42px;line-height:1.1;letter-spacing:-1.7px;">
                        {{safeHeading}}
                      </h1>
                      <p style="margin:0 0 28px;color:#566173;font-size:18px;line-height:1.55;">{{safeInstructions}}</p>
                      <a href="{{safeUrl}}"
                         style="display:inline-block;background:#3558c8;color:#ffffff;text-align:center;
                                padding:16px 24px;border-radius:10px;text-decoration:none;font-size:17px;
                                font-weight:bold;">
                        {{safeHeading}}
                      </a>
                    </td>
                  </tr>
                  <tr>
                    <td bgcolor="#f8faff" style="padding:20px 6%;background:#f8faff;border-top:1px solid #dce2ec;border-radius:0 0 19px 19px;">
                      <p style="margin:0;color:#566173;font-size:14px;line-height:1.6;">
                        {{safeNotice}}
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
        """;
    }
}
