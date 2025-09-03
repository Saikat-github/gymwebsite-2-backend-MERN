export const applyPagination = async (query, model, cursor, limit = 15,) => {
    if (cursor) {
        const cursorDate = new Date(cursor);
        if (!isNaN(cursorDate.getTime())) {
            query.createdAt = { $lt: cursorDate }; // Fetch records before the cursor
        } else {
            throw new Error("Invalid cursor format");
        }
    }

    const results = await model.find(query)
        .sort({ createdAt: -1 }) // Sorting newest to oldest
        .limit(limit + 1) // Fetch one extra to check for next page
        .select('-password'); //  Exclude the password field if it exists
        
    // Check if there's a next page
    const hasNextPage = results.length > limit;
    const trimmedResults = hasNextPage ? results.slice(0, -1) : results;

    // Get next cursor
    const nextCursor = hasNextPage ? trimmedResults[trimmedResults.length - 1].createdAt.toISOString() : null;

    return { results: trimmedResults, hasNextPage, nextCursor };
};







export const applyPaginationForDayPasses = async (query, model, cursor, limit = 15) => {
    if (cursor) {
        const cursorDate = new Date(cursor);
        if (!isNaN(cursorDate.getTime())) {
            query.createdAt = { $lt: cursorDate }; // Fetch records before the cursor
        } else {
            throw new Error("Invalid cursor format");
        }
    }

    const results = await model.find(query)
        .sort({ createdAt: -1 }) // newest to oldest
        .limit(limit + 1)
        .populate({
            path: "paymentId",  // 👈 populate paymentId
            select: "amount paymentStatus planEndDate paymentDate paymentId, paymentMethod" // only select needed fields
        });

    const hasNextPage = results.length > limit;
    const trimmedResults = hasNextPage ? results.slice(0, -1) : results;

    const nextCursor = hasNextPage
        ? trimmedResults[trimmedResults.length - 1].createdAt.toISOString()
        : null;

    return { results: trimmedResults, hasNextPage, nextCursor };
};
