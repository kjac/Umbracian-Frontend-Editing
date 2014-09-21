using System.Web;
using System.Web.Mvc;
using Umbraco.Web;

namespace Umbracian.FrontendEditing {
	/// <summary>
	/// Helper class for including frontend editing in page rendering
	/// </summary>
	public static class Helper {
		private const string SessionVariableName = "ufe";

		/// <summary>
		/// Initialize the frontend editing on a page
		/// </summary>
		/// <returns>The required scripts and CSS references if there's an active frontend editing sessions</returns>
		public static IHtmlString Init() {
			// needs a published content request and an active frontend editing session to render anything
			if (HasSession() == false) {
				return MvcHtmlString.Empty;
			}

			return new MvcHtmlString(string.Format(@"
    <script src=""/js/ufe.js""></script>
    <script>
      ufeInit({0});
    </script>
    <link href=""/css/ufe.css"" rel=""stylesheet"" />
", UmbracoContext.Current.PublishedContentRequest.PublishedContent.Id)
			);
		}

		/// <summary>
		/// Check if there's an active frontend editing session
		/// </summary>
		/// <returns>True if there's an active frontend editing session, false otherwise</returns>
		public static bool HasSession() {
			if (HasValidContext() == false) {
				return false;
			}
			return UmbracoContext.Current.HttpContext.Session[SessionVariableName] != null;
		}

		/// <summary>
		/// Starts the frontend editing session
		/// </summary>
		/// <returns>True if the session was started, false otherwise</returns>
		public static bool Begin() {
			if (HasValidContext() == false) {
				return false;
			}
			UmbracoContext.Current.HttpContext.Session[SessionVariableName] = "true";
			return true;
		}

		/// <summary>
		/// Ends the frontend editing session
		/// </summary>
		/// <returns>True if the session was ended, false otherwise</returns>
		public static bool End() {
			if (HasValidContext() == false) {
				return false;
			}
			UmbracoContext.Current.HttpContext.Session.Remove(SessionVariableName);
			return true;
		}

		/// <summary>
		/// Toggles the frontend editing session
		/// </summary>
		/// <returns>True if the session was toggled, false otherwise</returns>
		public static bool Toggle() {
			if (HasValidContext() == false) {
				return false;
			}
			return UmbracoContext.Current.HttpContext.Session[SessionVariableName] == null ? Begin() : End();
		}

		/// <summary>
		/// Redirects the current page to itself
		/// </summary>
		public static void RedirectToSelf() {
			if (HasValidContext() == false) {
				return;
			}
			UmbracoContext.Current.HttpContext.Response.Redirect(UmbracoContext.Current.PublishedContentRequest.PublishedContent.Url);
		}

		private static bool HasValidContext() {
			return UmbracoContext.Current.PublishedContentRequest != null && UmbracoContext.Current.HttpContext.Session != null;
		}
	}
}
