// these are the globally available methods called from the template and the backoffice
function ufeInit(pageId) {
  ufe.Init(pageId);
}

function ufeLoadComplete() {
  ufe.LoadComplete();
}

function ufeEditComplete(url) {
  ufe.EditComplete(url);
}

// this is the localization object (optional)
var ufeLocalize = null;

// create object to scope the rest of the methods
var ufe = {
  PageId: 0,

  SlideDuration: 400,
  FadeDuration: 200,
  State: null,

  Edit: null,
  Create: null,
  UnPublish: null,
  Delete: null,
  Login: null,
  Logout: null,
  Frame: null,
  LoginPanel: null,
  CreatePanel: null,
  UnPublishPanel: null,
  DeletePanel: null,
  ContentTypeSelector: null,
  Active: null,
  Controls: null,  
};

ufe.LoadComplete = function() {
  this.GoToProperty(this.PropertyAlias);
  this.Frame.slideDown(this.SlideDuration, function () {
    ufe.SetOpen();
    ufe.SetReady();
  });
}

ufe.EditComplete = function(url) {
  if (this.IsOpen()) {
    this.SetBusy();
    this.Frame.slideUp(this.SlideDuration, function () {
      location.assign(url);
    });
  }
}

ufe.IsOpen = function() {
  return this.Frame.is(':visible');
}

ufe.Init = function(pageId) {
  this.PageId = pageId;
}

ufe.SetBusy = function() {
  this.Active.addClass("ufe_busy");
}

ufe.SetReady = function() {
  this.Active.removeClass("ufe_busy");
}

ufe.SetOpen = function() {
  this.Active.addClass("ufe_open");
}

ufe.SetClosed = function() {
  this.Active.removeClass("ufe_open");

  $(this.Controls).each(function (index, element) {
    $(element).removeClass("ufe_disabled");
  });
}

ufe.SetActive = function(element) {
  $(this.Controls).each(function (index, element) {
    $(element).addClass("ufe_disabled");
  });

  this.Active = element;
  this.Active.removeClass("ufe_disabled");
}

ufe.SetState = function(state) {
  this.State = state;
  $(this.Controls).each(function (index, element) {
    $(element).removeClass("ufe_allowed ufe_restricted ufe_disabled ufe_hidden");
  });

  if (this.State.Authenticated == false) {
    this.Login.removeClass("ufe_hidden");
    $(this.Controls).each(function (index, element) {
      $(element).addClass("ufe_hidden");
    });
    return;
  }
  this.Login.addClass("ufe_hidden");
  this.Logout.removeClass("ufe_hidden");

  this.SetControlState(this.Edit, this.State.CanEdit);
  this.SetControlState(this.Create, this.State.CanCreate);
  this.SetControlState(this.UnPublish, this.State.CanUnPublish);
  this.SetControlState(this.Delete, this.State.CanDelete);
}

ufe.SetControlState = function(control, allowed) {
  if (allowed) {
    control.addClass("ufe_allowed");
  }
  else {
    control.addClass("ufe_restricted");
  }
}

ufe.StatusUrl = function() {
  return "/umbraco/api/umbracianfrontendediting/editstatus/" + this.PageId;
}

ufe.AuthenticationUrl = function() {
  return "/umbraco/api/umbracianfrontendediting/authenticated/";
}

ufe.CreateContentTypeUrl = function(contentType) {
  return "/umbraco/#/content/content/edit/" + this.PageId + "?doctype=" + contentType + "&create=true&ufe"
}

ufe.LoadStatus = function() {
  // check access status
  $.get(this.StatusUrl(), function (data) {
    ufe.SetState(data);
    ufe.SetReady();
  });

}

ufe.EditContent = function(propertyAlias) {
  if (this.State.CanEdit == false) {
    return;
  }
  if (this.Active.hasClass("ufe_busy") || this.Edit.hasClass("ufe_disabled")) {
    return;
  }

  this.ToggleFrame(this.Edit, "/umbraco#/content/content/edit/" + this.PageId + "?ufe", propertyAlias);    
}

ufe.GoToProperty = function() {
  this.Frame[0].contentWindow.angular.element("#Umbracian_FrontendEditing").scope().goToProperty(this.PropertyAlias);            
}

ufe.ToggleFrame = function(element, url, propertyAlias) {
  this.PropertyAlias = propertyAlias;
  
  this.SetActive(element);
  this.SetBusy();

  // if the frame is already shown, simply hide it
  if (this.IsOpen()) {
    this.Frame.slideUp(this.SlideDuration, function () {
      ufe.SetClosed();
      ufe.SetReady();
    });
  }
  else {
    // the frame is closed - check for access again, in case of a timeout
    $.get(this.AuthenticationUrl(), function (data) {
      if (data == true) {
        // it the frame has already been loaded, just show it
        if (ufe.Frame.attr("src") && ufe.Frame.attr("src").indexOf(url) == 0) {
          ufe.LoadComplete();
        }
        else {
          // load the frame
          ufe.Frame.attr("src", url);
        }
      }
      else {
        // no longer authenticated - reload status
        ufe.LoadStatus();
      }
    });
  }
}

ufe.Localize = function () {
  if (!(ufeLocalize && ufeLocalize.GetText)) {
    // no localization defined
    return;
  }

  this.LocalizeElements("title");
  this.LocalizeElements("placeholder");
  this.LocalizeElements("text");
  this.LocalizeElements("html");
}

ufe.LocalizeElements = function(target) {
  $("[data-ufelocalize-" + target + "]").each(function (index, element) {
    var e = $(element);
    var key = e.data("ufelocalize-" + target);
    var localized = ufeLocalize.GetText(key);
    if(localized == null || localized == "") {
      console.warn("No localized text returned for key", key);
    }
    else {
      switch(target) {
        case "title":
        case "placeholder":
          e.attr(target, localized);
          break;
        case "html":
          e.html(localized);
          break;
        case "text":
          e.text(localized);
          break;
      }
    }
  });
}

// set up event handlers and stuff after page load
ufe.PageLoad = function() {
  this.Edit = $("#ufe_edit");
  this.Create = $("#ufe_create");
  this.UnPublish = $("#ufe_unpublish");
  this.Delete = $("#ufe_delete");
  this.Login = $("#ufe_login");
  this.Logout = $("#ufe_logout");
  this.Frame = $("#ufe_frame");
  this.LoginPanel = $("#ufe_loginpanel");
  this.CreatePanel = $("#ufe_createpanel");
  this.UnPublishPanel = $("#ufe_unpublishpanel");
  this.DeletePanel = $("#ufe_deletepanel");
  this.ContentTypeSelector = $("#ufe_contenttypeselector");

  this.Controls = [this.Edit, this.Create, this.UnPublish, this.Delete, this.Logout];

  this.Active = this.Login;

  this.SetBusy();

  // check access status
  this.LoadStatus();

  this.Edit.click(function (e) {
    e.preventDefault();
    if (ufe.State.CanEdit == false) {
      return;
    }
    if (ufe.Active.hasClass("ufe_busy") || ufe.Edit.hasClass("ufe_disabled")) {
      return;
    }

    ufe.ToggleFrame(ufe.Edit, "/umbraco#/content/content/edit/" + ufe.PageId + "?ufe");
  });

  this.Create.click(function (e) {
    e.preventDefault();
    if (ufe.State.CanCreate == false) {
      return;
    }
    if (ufe.CreatePanel.is(':visible') || ufe.Active.hasClass("ufe_busy") || ufe.Create.hasClass("ufe_disabled")) {
      return;
    }

    if (ufe.IsOpen() && ufe.ContentTypeSelector.val()) {
      ufe.ToggleFrame(ufe.Create, ufe.CreateContentTypeUrl(ufe.ContentTypeSelector.val()));
      return;
    }

    ufe.SetActive(ufe.Create);
    ufe.SetOpen();

    ufe.ContentTypeSelector.empty();
    var options = "";
    $(ufe.State.AllowedContentTypes).each(function (index, item) {
      options += "<option value='" + item.Alias + "'>" + item.Name + "</option>";
    });
    ufe.ContentTypeSelector.append(options);
    ufe.CreatePanel.fadeIn(ufe.FadeDuration);
  });

  this.Delete.click(function (e) {
    e.preventDefault();
    if (ufe.State.CanDelete == false) {
      return;
    }
    if (ufe.DeletePanel.is(':visible') || ufe.Active.hasClass("ufe_busy") || ufe.Delete.hasClass("ufe_disabled")) {
      return;
    }

    ufe.SetActive(ufe.Delete);
    ufe.SetOpen();
    ufe.DeletePanel.fadeIn(ufe.FadeDuration);

  });

  this.UnPublish.click(function (e) {
    e.preventDefault();
    if (ufe.State.CanUnPublish == false) {
      return;
    }
    if (ufe.UnPublishPanel.is(':visible') || ufe.Active.hasClass("ufe_busy") || ufe.UnPublish.hasClass("ufe_disabled")) {
      return;
    }

    ufe.SetActive(ufe.UnPublish);
    ufe.SetOpen();
    ufe.UnPublishPanel.fadeIn(ufe.FadeDuration);

  });

  $("#ufe_createcontent").click(function (e) {
    e.preventDefault();
    ufe.SetBusy();
    ufe.CreatePanel.fadeOut(ufe.FadeDuration, function () {
      ufe.ToggleFrame(ufe.Create, ufe.CreateContentTypeUrl(ufe.ContentTypeSelector.val()));
    });
  });

  $("#ufe_unpublishcontent").click(function (e) {
    e.preventDefault();
    ufe.SetBusy();
    ufe.UnPublishPanel.fadeOut(ufe.FadeDuration, function () {
      // attempt a delete
      $.post("/umbraco/api/umbracianfrontendediting/unpublish/" + ufe.PageId, function (data) {
        if (data.UnPublished == true) {
          // delete succeeded, redirect to assigned redirect URL
          location.assign(data.RedirectUrl);
        }
        else {
          // delete failed, something's wrong - reload status
          ufe.LoadStatus();
        }
      })
        .fail(function (data) {
          console.log("Unpublish failed", data);
        });
    });
  });

  $("#ufe_deletecontent").click(function (e) {
    e.preventDefault();
    ufe.SetBusy();
    ufe.DeletePanel.fadeOut(ufe.FadeDuration, function () {
      // attempt a delete
      $.post("/umbraco/api/umbracianfrontendediting/delete/" + ufe.PageId, function (data) {
        if (data.Deleted == true) {
          // delete succeeded, redirect to assigned redirect URL
          location.assign(data.RedirectUrl);
        }
        else {
          // delete failed, something's wrong - reload status
          ufe.LoadStatus();
        }
      })
        .fail(function (data) {
          console.log("Delete failed", data);
        });
    });
  });

  
  // $(".ufe_panel").keydown(function (e) {
    // if(e.keyCode == 27) {
      // $(".ufe_cancel", $(this)).click();
    // }
  // });
  
  $(".ufe_cancel").click(function (e) {
    e.preventDefault();
    var panel = $(this).closest(".ufe_panel");
    if (panel.is(':visible')) {
      panel.fadeOut(ufe.FadeDuration, function () {
        ufe.SetClosed();
      });
    }
  });

  $("#ufe_loginuser").click(function(e) {
    e.preventDefault();
    ufe.SetBusy();

    // attempt a login
    $.post("/umbraco/api/umbracianfrontendediting/login", { username: $("#ufe_username").val(), password: $("#ufe_password").val() }, function(data) {
        if (data == true) {
          // login succeeded
          // - reload page to render edit markers (if any)
          location.reload();

          // // login succeeded
          // $("#ufe_username").removeClass("ufe_invalid");
          // $("#ufe_password").removeClass("ufe_invalid");

          // // hide the login panel
          // ufe.LoginPanel.fadeOut(ufe.FadeDuration, function() {
            // ufe.SetClosed();
            // // reload status
            // ufe.LoadStatus();
          // });
        }
        else {
          // login failed
          $("#ufe_username").addClass("ufe_invalid");
          $("#ufe_password").addClass("ufe_invalid");
          ufe.SetReady();
        }
      })
      .fail(function(data) {
        console.log("Login failed", data);
      });
  });

  this.Login.click(function (e) {
    e.preventDefault();
    if (ufe.State.Authenticated) {
      return;
    }
    if (ufe.LoginPanel.is(':visible')) {
      return;
    }
    ufe.SetActive(ufe.Login);
    ufe.SetOpen();
    ufe.LoginPanel.fadeIn(ufe.FadeDuration);
  });

  this.Logout.click(function (e) {
    e.preventDefault();
    if (ufe.Active.hasClass("ufe_busy") || ufe.Logout.hasClass("ufe_disabled")) {
      return;
    }
    // attempt a logout
    ufe.SetActive(ufe.Logout);
    ufe.SetBusy();
    $.post("/umbraco/api/umbracianfrontendediting/logout", function (data) {
      location.reload();
    });
  });
}

// use this instead of $(document).ready to handle any missing jQuery gracefully
document.addEventListener("DOMContentLoaded", function () {
  if (!window.jQuery) {
    alert("Error: Frontend Editing requires jQuery loaded on the page.")
    return;
  }

  // inject the required markup here so the template doesn't have to contain it
  $("body").append(
    '\
  <div class="ufe_controls"> \
    <a href class="ufe_control" id="ufe_login" title="Login" data-ufelocalize-title="login.control.title"></a> \
    <a href class="ufe_control ufe_hidden" id="ufe_edit" title="Edit" data-ufelocalize-title="edit.control.title"></a> \
    <a href class="ufe_control ufe_hidden" id="ufe_create" title="Create" data-ufelocalize-title="create.control.title"></a> \
    <a href class="ufe_control ufe_hidden" id="ufe_unpublish" title="Unpublish" data-ufelocalize-title="unpublish.control.title"></a> \
    <a href class="ufe_control ufe_hidden" id="ufe_delete" title="Delete" data-ufelocalize-title="delete.control.title"></a> \
    <a href class="ufe_control ufe_hidden" id="ufe_logout" title="Logout" data-ufelocalize-title="logout.control.title"></a> \
  </div> \
  <div class="ufe_panel" id="ufe_loginpanel"> \
    <p data-ufelocalize-html="login.dialog.text">Please login to start editing.</p> \
    <form> \
    <input type="text" id="ufe_username" placeholder="Username" data-ufelocalize-placeholder="login.dialog.username.placeholder" /> \
    <input type="password" id="ufe_password" placeholder="Password" data-ufelocalize-placeholder="login.dialog.password.placeholder" /> \
    <button id="ufe_loginuser" data-ufelocalize-text="login.dialog.button.ok">Login</button> \
    <button class="ufe_cancel" data-ufelocalize-text="login.dialog.button.cancel">Cancel</button> \
    </form> \
  </div> \
  <div class="ufe_panel" id="ufe_createpanel"> \
    <p data-ufelocalize-html="create.dialog.text">Select which kind of page you want to create:</p> \
    <select id="ufe_contenttypeselector" /> \
    <button id="ufe_createcontent" data-ufelocalize-text="create.dialog.button.ok">Create</button> \
    <button class="ufe_cancel" data-ufelocalize-text="create.dialog.button.cancel">Cancel</button> \
  </div> \
  <div class="ufe_panel" id="ufe_deletepanel"> \
    <p data-ufelocalize-html="delete.dialog.text">Are you sure you want to <span class="attention">delete</span> this page?</p> \
    <button id="ufe_deletecontent" data-ufelocalize-text="delete.dialog.button.ok">Yes</button> \
    <button class="ufe_cancel" data-ufelocalize-text="delete.dialog.button.cancel">No</button> \
  </div> \
  <div class="ufe_panel" id="ufe_unpublishpanel"> \
    <p data-ufelocalize-html="unpublish.dialog.text">Are you sure you want to <span class="attention">unpublish</span> this page?</p> \
    <button id="ufe_unpublishcontent" data-ufelocalize-text="unpublish.dialog.button.ok">Yes</button> \
    <button class="ufe_cancel" data-ufelocalize-text="unpublish.dialog.button.cancel">No</button> \
  </div> \
  <iframe id="ufe_frame"> \
  </iframe> \
    '
  );

  ufe.Localize();
  ufe.PageLoad();
});