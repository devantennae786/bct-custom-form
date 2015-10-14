var metadata = require('react-component-metadata')
  , handlebars = require('handlebars')
  , assign = require('react/lib/Object.assign')
  , each = require('lodash/collection/each')
  , transform = require('lodash/object/transform')
  , fs = require('fs')
  , path = require('path');



handlebars.registerHelper('cleanDoclets', function types(desc, options){
  desc = desc || ''
  var idx = desc.indexOf('@')
  return (idx === -1 ? desc : desc.substr(0, idx )).trim()
})

handlebars.registerHelper('isRequired', function types(prop, options){
  var doclets = metadata.parseDoclets(prop.desc || '') || {};
  return prop.required || !!doclets.required
})

handlebars.registerHelper('propType', function types(prop, options){
  var type = prop.type
    , name = type.name
    , doclets = metadata.parseDoclets(prop.desc || '') || {};

  switch (name){
    case 'object':
      if( type.value )
        return 'object: ' + displayObj(transform(type.value, function(obj, val, key){
          obj[key] = types(val)
        }, {}))

      return name
    case 'union':
      return type.value.map(function(val){
        return types({ type: val })
      }).join(', ')

    case 'array':
      return 'array<' + type.value.name + '>'
    case 'enum':
      return 'enum<' + type.value.join(', ') + '>'
    case 'custom':
      return cleanDocletValue(doclets.type || name)
    default:
      return name
  }
})

var apiFile = handlebars.compile(fs.readFileSync(__dirname + '/../templates/api.hbs').toString())

module.exports = function(contents) {
  var result = {}
  var markdown;

  each(metadata(contents), function(val, key) {

    if( val.desc || Object.keys(val.props).length ){
      var doclets = metadata.parseDoclets(val.desc || '') || {};

      markdown = apiFile(assign({ name: doclets.alias || key }, val))
    }
  }, this)

  return markdown
}


function displayObj(obj){
  return JSON.stringify(obj, null, 2).replace(/"|'/g, '')
}

function cleanDocletValue(str){
  return str.replace(/^\{/, '').replace(/\}$/, '')
}

function replaceExtension(npath, ext) {
  if (typeof npath !== 'string') return npath;
  if (npath.length === 0) return npath;

  var nFileName = path.basename(npath, path.extname(npath))+ext;
  return path.join(path.dirname(npath), nFileName);
}
