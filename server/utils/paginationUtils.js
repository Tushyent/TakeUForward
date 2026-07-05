export const getPaginationParams = (pageQuery, limitQuery, maxLimit = 50) => {
  let page = parseInt(pageQuery, 10);
  if (isNaN(page) || page < 1) {
    page = 1;
  }

  let limit = parseInt(limitQuery, 10);
  if (isNaN(limit) || limit < 1) {
    limit = 10;
  } else if (limit > maxLimit) {
    limit = maxLimit;
  }

  const skip = (page - 1) * limit;

  return { page, limit, skip };
};
