module.exports = function(grunt) {
  // Profile task execution --------------------------------------- //
  require('time-grunt')(grunt);
  require('load-grunt-tasks')(grunt);

  // Project configuration ---------------------------------------- //
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    // Copy files without processing them ------------------------- //
    copy: {
      package: {
        files: [
          {
            cwd: 'Site/App_Plugins/Umbracian.FrontendEditing',
            src: ['css/frontendediting.css', 'js/frontendediting.js', 'views/frontendediting.html', 'package.manifest'],
            dest: 'Package',
            expand: true,
            flatten: true
          },
          {
            cwd: 'Site',
            src: ['bin/Umbracian.FrontendEditing.dll', 'css/ufe.css', 'js/ufe.js'],
            dest: 'Package',
            expand: true,
            flatten: true
          }
        ]
      }
    },
    
    // Minification and concatenation of Javascript --------------- //
    uglify: {
      package: {
        files: {
          'Package/ufe.js': ['Site/js/ufe.js']
        }
      }
    },

    // Build project file ----------------------------------------- //
    msbuild: {
      options: {
        stdout: true,
        verbosity: 'quiet',
        maxCpuCount: 4,
		version: 4.0,
        buildParameters: {
          WarningLevel: 2,
          NoWarn: 1607
        }
      },
      release: {
        src: ['Solution/Umbracian.FrontendEditing/Umbracian.FrontendEditing.csproj'],
        options: {
          projectConfiguration: 'Release',
          targets: ['Clean', 'Rebuild'],
        }
      },
      debug: {
        src: ['Solution/Umbracian.FrontendEditing/Umbracian.FrontendEditing.csproj'],
        options: {
          projectConfiguration: 'Debug',
          targets: ['Clean', 'Rebuild'],
        }
      }
    }

  });

  grunt.registerTask('default', ['msbuild:debug', 'copy:package']);
  grunt.registerTask('package', ['msbuild:release', 'copy:package', 'uglify:package']);
};