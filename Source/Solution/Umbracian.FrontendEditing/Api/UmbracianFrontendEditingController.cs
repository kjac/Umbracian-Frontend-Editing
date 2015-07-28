using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Web;
using System.Web.Http;
using System.Web.Http.Controllers;
using umbraco.BusinessLogic.Actions;
using Umbraco.Core.Models;
using Umbraco.Core.Models.Membership;
using umbraco.interfaces;
using Umbraco.Core.Security;
using Umbraco.Web;
using Umbraco.Web.Models;
using Umbraco.Web.WebApi;

namespace Umbracian.FrontendEditing.Api {
	public class UmbracianFrontendEditingController : UmbracoApiController {
		protected override void Initialize(HttpControllerContext controllerContext) {
			AuthenticationHelper.AuthenticateTicket();
			base.Initialize(controllerContext);
		}

		[HttpPost]
		public bool Login(LoginModel loginModel) {
			if (Security.ValidateBackOfficeCredentials(loginModel.Username, loginModel.Password)) {
				var user = Services.UserService.GetByUsername(loginModel.Username);
				if (user != null) {
					var ticket = Security.PerformLogin(user);
					return ticket != null;
				}
			}
			return false;
		}

		[HttpPost]
		public bool Logout() {
			Security.ClearCurrentLogin();
			return true;
		}

		[HttpPost]
		public object Delete(int id) {
			// get the current user 
			var user = Security.CurrentUser;
			if (user == null) {
				return new {
					Authenticated = false,
					Deleted = false
				};
			}

			// get the content to delete
			var content = Services.ContentService.GetById(id);
			if (content == null || CanDeleteContent(content) == false || user.HasPathAccess(content) == false) {
				return new {
					Authenticated = true,
					Deleted = false
				};
			}

			// make sure the user is actually allowed to delete this content
			var permissions = Services.UserService.GetPermissions(user, content.Id).FirstOrDefault();
			if (permissions == null || permissions.ContainsPermission(ActionDelete.Instance) == false) {
				return new {
					Authenticated = true,
					Deleted = false
				};
			}

			// redirect to parent content after deletion
			var redirectUrl = Umbraco.Url(content.ParentId);

			// move the content to the bin
			Services.ContentService.MoveToRecycleBin(content, user.Id);

			return new {
				Authenticated = true,
				Deleted = true,
				RedirectUrl = redirectUrl
			};
		}

		[HttpPost]
		public object UnPublish(int id) {
			// get the current user 
			var user = Security.CurrentUser;
			if (user == null) {
				return new {
					Authenticated = false,
					UnPublished = false
				};
			}

			// get the content to delete
			var content = Services.ContentService.GetById(id);
			if (content == null || CanUnPublishContent(content) == false || user.HasPathAccess(content) == false) {
				return new {
					Authenticated = true,
					UnPublished = false
				};
			}

			// make sure the user is actually allowed to unpublish this content
			var permissions = Services.UserService.GetPermissions(user, content.Id).FirstOrDefault();
			if (permissions == null || permissions.ContainsPermission(ActionUnPublish.Instance) == false) {
				return new {
					Authenticated = true,
					UnPublished = false
				};
			}

			// redirect to parent content after unpublishing the content
			var redirectUrl = Umbraco.Url(content.ParentId);

			// unpublish the content
			Services.ContentService.UnPublish(content, user.Id);

			return new {
				Authenticated = true,
				UnPublished = true,
				RedirectUrl = redirectUrl
			};
		}

		[HttpGet]
		public bool Authenticated() {
			return Security.CurrentUser != null;
		}

		[HttpGet]
		public object EditStatus(int id) {
			var user = Security.CurrentUser;
			if (user == null) {
				// this might happen if the user session expires
				return new {
					Authenticated = false,
					CanEdit = false,
					CanCreate = false,
					CanDelete = false,
					CanUnPublish = false
				};
			}

			var content = Services.ContentService.GetById(id);
			if (content == null || user.HasPathAccess(content) == false) {
				// user does not have access to this content
				return new {
					Authenticated = true,
					CanEdit = false,
					CanCreate = false,
					CanDelete = false,
					CanUnPublish = false
				};
			}

			var contentType = UmbracoContext.Current.Application.Services.ContentTypeService.GetContentType(content.ContentTypeId);
			if (IsFrontendEditable(contentType) == false) {
				// can't manipulate the current content in any way if it's not marked as frontend editable
				return new {
					Authenticated = true,
					CanEdit = false,
					CanCreate = false,
					CanDelete = false,
					CanUnPublish = false
				};
			}

			var permissions = Services.UserService.GetPermissions(user, content.Id).FirstOrDefault();
			if (permissions == null) {
				// hopefully this shouldn't ever happen!
				return new {
					Authenticated = true,
					CanEdit = false,
					CanCreate = false,
					CanDelete = false,
					CanUnPublish = false
				};
			}

			// see ContentPostValidateAttribute for permissions setup
			// https://github.com/umbraco/Umbraco-CMS/blob/eae00873073f20c60e355ec6e95ff6259ad2652b/src/Umbraco.Web/Editors/ContentPostValidateAttribute.cs

			// get user permissions
			var create = permissions.ContainsPermission(ActionNew.Instance);
			var update = permissions.ContainsPermission(ActionUpdate.Instance);
			var unPublish = permissions.ContainsPermission(ActionUnPublish.Instance) && CanUnPublishContent(content);
			var delete = permissions.ContainsPermission(ActionDelete.Instance) && CanDeleteContent(content);

			List<IContentType> allowedContentTypes = null;
			// it requires both create and update permissions to create content - don't bother looking up the allowed 
			// content types if the user does not have both
			if (create && update) {
				// get the allowed content types select only those that are frontend editable
				allowedContentTypes = contentType.AllowedContentTypes
					.Select(c => UmbracoContext.Current.Application.Services.ContentTypeService.GetContentType(c.Id.Value))
					.Where(c => c != null && IsFrontendEditable(c))
					.ToList();

				allowedContentTypes = allowedContentTypes.Any() ? allowedContentTypes : null;
			}

			create = create & allowedContentTypes != null;

			return new {
				Authenticated = true,
				CanEdit = update,
				CanCreate = create & update,
				CanDelete = delete,
				CanUnPublish = unPublish,
				AllowedContentTypes = allowedContentTypes == null ? null : allowedContentTypes.Select(c => new {c.Alias, c.Name})
			};
		}

		private bool IsFrontendEditable(IContentType c) {
			// content type is frontend editable if it has a property of type Umbracian.FrontendEditing
			return c.CompositionPropertyTypes.Any(p => p.PropertyEditorAlias == FrontendEditingModel.DataTypeAlias);
		}

		private bool CanUnPublishContent(IContent content) {
			// for now, if you can delete content you can unpublish it too
			return CanDeleteContent(content);
		}

		private bool CanDeleteContent(IContent content) {
			// no matter what, don't allow deleting content at root level
			return content.Level > 1;
		}
	}
}
