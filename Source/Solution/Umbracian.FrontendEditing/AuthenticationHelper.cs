using System.Web;
using Umbraco.Core.Security;

namespace Umbracian.FrontendEditing {
	internal static class AuthenticationHelper {
		public static bool AuthenticateTicket() {
			// see http://issues.umbraco.org/issue/U4-6342#comment=67-19466 (from http://issues.umbraco.org/issue/U4-6332)
			var http = new HttpContextWrapper(HttpContext.Current);
			var ticket = http.GetUmbracoAuthTicket();
			if (ticket != null)
			{
				return http.AuthenticateCurrentRequest(ticket, true);
			}
			return false;
		}
	}
}
