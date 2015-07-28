using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Web;
using System.Web.Mvc;
using Umbraco.Core.Security;
using Umbraco.Web;

namespace Umbracian.FrontendEditing {
	public static class HtmlHelperExtensions {
		public static MvcFrontendEditable BeginConditionalFrontendEditable(this HtmlHelper htmlHelper, bool condition, string propertyAlias, string propertyName = null) {
			return condition
				? BeginFrontendEditable(htmlHelper, propertyAlias, propertyName)
				: new MvcFrontendEditable(htmlHelper.ViewContext, false);
		}

		public static MvcFrontendEditable BeginFrontendEditable(this HtmlHelper htmlHelper, string propertyAlias, string propertyName = null) {
			var shouldWriteOutput = false;

			if (Helper.HasSession()) {
				if (UmbracoContext.Current.Security.CurrentUser == null) {
					AuthenticationHelper.AuthenticateTicket();
				}
				shouldWriteOutput = UmbracoContext.Current.Security.CurrentUser != null;
			}
			if (shouldWriteOutput)
			{
				htmlHelper.ViewContext.Writer.Write(@"<div class=""ufe_editable"">
	<span class=""ufe_marker"" onclick=""ufe.EditContent('{0}');""", propertyAlias);
				if (string.IsNullOrWhiteSpace(propertyName) == false) {
					htmlHelper.ViewContext.Writer.Write(@" title=""Edit {0}"" data-ufelocalize-title=""editable.edit.{1}""", propertyName, propertyAlias);
				}
				htmlHelper.ViewContext.Writer.Write(@">
	</span>");				
			}
			return new MvcFrontendEditable(htmlHelper.ViewContext, shouldWriteOutput);
		}
	}

	public class MvcFrontendEditable : IDisposable
	{
		private readonly bool _shouldWriteClosingTag;
		private readonly TextWriter _writer;

		public MvcFrontendEditable(ViewContext viewContext, bool shouldWriteClosingTag)
		{
			_shouldWriteClosingTag = shouldWriteClosingTag;
			_writer = viewContext.Writer;
		}

		public void Dispose()
		{
			if (_shouldWriteClosingTag)
			{
				_writer.Write("</div>");				
			}
		}
	}
}
