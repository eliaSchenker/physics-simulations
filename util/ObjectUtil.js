/**
 * © 2021 Elia Schenker
 */
class ObjectUtil {
    static clone(obj) {
        if (obj === null || typeof (obj) !== 'object' || 'isActiveClone' in obj)
            return obj;
    
        if (obj instanceof Date)
            var temp = new obj.constructor(); //or new Date(obj);
        else
            var temp = new obj.constructor();
    
        for (var key in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, key)) {
                obj['isActiveClone'] = null;
                temp[key] = ObjectUtil.clone(obj[key]);
                delete obj['isActiveClone'];
            }
        }
        return temp;
    }
}