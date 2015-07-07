
module.exports = function (app, acl) {

    var mongoBackend = new acl.mongodbBackend(app.db.db, 'acl_');

    /**
     * Returns the objects in a specific collection
     *
     * @param bucket the name of collection
     * @param fields the name of fields to show
     * @param cb
     */
    mongoBackend.getAll = function (bucket, fields, cb) {
        var collName = (this.useSingle ? aclCollectionName : bucket);
        this.db.collection(this.prefix + collName, function (err, collection) {
            if (err) {
                return cb(err);
            }
            var show = {};
            fields.forEach(function (field){
                show[field] = 1;
            });
            show._id = 0;

            // Excluding bucket field from search result
            collection.find({}, show).toArray(function (err, doc) {
                if (err) {
                    return cb(err);
                }
                cb(undefined, doc);
            });
        });
    }

    return mongoBackend;
}
