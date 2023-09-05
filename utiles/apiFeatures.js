class APIFeatures {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
  }
  filter() {
    //-- 1A) FILTERING
    const queryObj = { ...this.queryString };
    let excludedFields = ['page', 'sort', 'limit', 'fields'];
    excludedFields.forEach((el) => delete queryObj[el]);
    // console.log(req.query, queryObj, 'query filter');

    //-- 1B) ADVANCED FILTERING
    // converting the object to the string using JSON>stringify
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);
    console.log(JSON.parse(queryStr), 'query string', 'api features file');

    this.query.find(JSON.parse(queryStr));
    // let query = Tour.find(JSON.parse(queryStr));
    return this;
  }
  sort() {
    //127.0.0.1:3000/api/v1/tours?sort=name,duration,difficulty,price
    if (this.queryString.sort) {
      const sortBy = this.queryString.sort.split(',').join(' ');
      // query = query.sort(req.query.sort); /* need to do sorting*/
      this.query =
        this.query.sort(
          sortBy
        ); /* wn we need to add 2 more properties to do the sort*/
    } else {
      this.query = this.query.sort('-createdAt');
    }
    return this;
  }

  limitFields() {
    if (this.queryString.fields) {
      const fields = this.queryString.fields.split(',').join(' ');
      // query = query.sort(req.query.sort); /* need to do sorting*/
      this.query =
        this.query.select(
          fields
        ); /* wn we need to add 2 more properties to do the sort*/
    } else {
      this.query = this.query.select('-__V');
    }
    return this;
  }
  paginate() {
    const page = this.queryString.page * 1 || 1;
    const limit = this.queryString.limit * 1 || 100;
    const skip = (page - 1) * limit;
    this.query = this.query.skip(skip).limit(limit);

    // if (this.queryString.page) {
    //   const numTours = await Tour.countDocuments();
    //   if (skip >= numTours) throw new Error('the page does not exist');
    // }
    return this;
  }
}

module.exports = APIFeatures;
