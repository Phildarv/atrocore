

Espo.define('utils', [], function () {
    var Utils = Espo.utils = Espo.Utils = {

        checkActionAccess: function (acl, obj, item) {
            var hasAccess = true;
            if (item.acl) {
                if (!item.aclScope) {
                    if (obj) {
                        if (typeof obj == 'string' || obj instanceof String) {
                            hasAccess = acl.check(obj, item.acl);
                        } else {
                            hasAccess = acl.checkModel(obj, item.acl);
                        }
                    } else {
                        hasAccess = acl.check(item.scope, item.acl);
                    }
                } else {
                    hasAccess = acl.check(item.aclScope, item.acl);
                }
            } else if (item.aclScope) {
                hasAccess = acl.checkScope(item.aclScope);
            }
            return hasAccess;
        },

        checkAccessDataList: function (dataList, acl, user, entity, allowAllForAdmin) {
            if (!dataList || !dataList.length) {
                return true;
            }

            for (var i in dataList) {
                var item = dataList[i];
                if (item.scope) {
                    if (item.action) {
                        if (!acl.check(item.scope, item.action)) {
                            return false;
                        }
                    } else {
                        if (!acl.checkScope(item.scope)) {
                            return false;
                        }
                    }
                } else if (item.action) {
                    if (entity) {
                        if (!acl.check(entity, item.action)) {
                            return false;
                        }
                    }
                }
                if (item.teamIdList) {
                    if (user && !(allowAllForAdmin && user.isAdmin())) {
                        var inTeam = false;
                        user.getLinkMultipleIdList('teams').forEach(function (teamId) {
                            if (~item.teamIdList.indexOf(teamId)) {
                                inTeam = true;
                            }
                        });
                        if (!inTeam) return false;
                    }
                }
                if (item.portalIdList) {
                    if (user && !(allowAllForAdmin && user.isAdmin())) {
                        var inPortal = false;
                        user.getLinkMultipleIdList('portals').forEach(function (portalId) {
                            if (~item.portalIdList.indexOf(portalId)) {
                                inPortal = true;
                            }
                        });
                        if (!inPortal) return false;
                    }
                }
                if (item.isPortalOnly) {
                    if (user && !(allowAllForAdmin && user.isAdmin())) {
                        if (!user.isPortal()) {
                            return false;
                        }
                    }
                } else if (item.inPortalDisabled) {
                    if (user && !(allowAllForAdmin && user.isAdmin())) {
                        if (user.isPortal()) {
                            return false;
                        }
                    }
                }

                if (item.isAdminOnly) {
                    if (user) {
                        if (!user.isAdmin()) {
                            return false;
                        }
                    }
                }
            }
            return true;
        },

        convert: function (string, p) {
            if (string == null) {
                return string;
            }

            var result = string;
            switch (p) {
                case 'c-h':
                case 'C-h':
                    result = Espo.Utils.camelCaseToHyphen(string);
                    break;
                case 'h-c':
                    result = Espo.Utils.hyphenToCamelCase(string);
                    break;
                case 'h-C':
                    result = Espo.Utils.hyphenToUpperCamelCase(string);
                    break;
            }
            return result;
        },

        isObject: function (obj) {
            if (obj === null) {
                return false;
            }
            return typeof obj === 'object';
        },

        clone: function (obj) {
            if (!Espo.Utils.isObject(obj)) {
                return obj;
            }
            return _.isArray(obj) ? obj.slice() : _.extend({}, obj);
        },

        cloneDeep: function (data) {
            data = Espo.Utils.clone(data);

            if (Espo.Utils.isObject(data) || _.isArray(data)) {
                for (var i in data) {
                    data[i] = this.cloneDeep(data[i]);
                }
            }
            return data;
        },

        /**
         * Compose class name.
         * @param {String} module
         * @param {String} name
         * @param {String} location
         * @return {String}
         */
        composeClassName: function (module, name, location) {
            if (module) {
                module = this.camelCaseToHyphen(module);
                name = this.camelCaseToHyphen(name).split('.').join('/');
                location = this.camelCaseToHyphen(location || '');

                return module + ':' + location + '/' + name;
            } else {
                name = this.camelCaseToHyphen(name).split('.').join('/');
                return location + '/' + name;
            }
        },

        composeViewClassName: function (name) {
            if (name && name[0] === name[0].toLowerCase()) {
                return name;
            }
            if (name.indexOf(':') != -1) {
                var arr = name.split(':');
                var modPart = arr[0];
                var namePart = arr[1];
                modPart = this.camelCaseToHyphen(modPart);
                namePart = this.camelCaseToHyphen(namePart).split('.').join('/');

                return modPart + ':' + 'views' + '/' + namePart;
            } else {
                name = this.camelCaseToHyphen(name).split('.').join('/');
                return 'views' + '/' + name;
            }
        },

        toDom: function (string) {
            return Espo.Utils.convert(string, 'c-h').split('.').join('-');
        },

        lowerCaseFirst: function (string) {
            if (string == null) {
                return string;
            }
            return string.charAt(0).toLowerCase() + string.slice(1);
        },

        upperCaseFirst: function (string) {
            if (string == null) {
                return string;
            }
            return string.charAt(0).toUpperCase() + string.slice(1);
        },

        hyphenToUpperCamelCase: function (string) {
            if (string == null) {
                return string;
            }
            return this.upperCaseFirst(string.replace(/-([a-z])/g, function (g) {return g[1].toUpperCase();}));
        },

        hyphenToCamelCase: function (string) {
            if (string == null) {
                return string;
            }
            return string.replace(/-([a-z])/g, function (g) {return g[1].toUpperCase();});
        },

        camelCaseToHyphen: function (string) {
            if (string == null) {
                return string;
            }
            return string.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
        },

        trimSlash: function (str) {
            if (str.substr(-1) == '/') {
                return str.substr(0, str.length - 1);
            }
            return str;
        }
    };

    return Utils;

});
