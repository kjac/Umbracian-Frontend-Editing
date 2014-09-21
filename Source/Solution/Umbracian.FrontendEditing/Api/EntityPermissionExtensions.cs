using System.Globalization;
using System.Linq;
using Umbraco.Core.Models.Membership;
using umbraco.interfaces;

namespace Umbracian.FrontendEditing.Api {
	public static class EntityPermissionExtensions {
		public static bool ContainsPermission(this EntityPermission permissions, IAction action) {
			return permissions.AssignedPermissions.Contains(action.Letter.ToString(CultureInfo.InvariantCulture));			
		}
	}
}