using Umbraco.Core.Models.PublishedContent;
using Umbraco.Core.PropertyEditors;

namespace Umbracian.FrontendEditing {
	[PropertyValueType(typeof(FrontendEditingModel))]
	[PropertyValueCache(PropertyCacheValue.All, PropertyCacheLevel.Content)]
	// this converter is here for future enhancement, in case the FE model will have some kind of useful function for rendering a page
	public class FormValueConverter : PropertyValueConverterBase {

		public override bool IsConverter(PublishedPropertyType propertyType) {
			return propertyType.PropertyEditorAlias.Equals(FrontendEditingModel.DataTypeAlias);
		}

		public override object ConvertDataToSource(PublishedPropertyType propertyType, object source, bool preview) {
			return new FrontendEditingModel();
		}
	}
}