export function fixPagination(total, pager = {current: 1, pageSize: 10}, filterCallback) {
    // Fix pagination current page excess, in this case there will certainly be 0 hits
    let current = pager.current;
    let available_pages = Math.ceil(total / pager.pageSize);
    if (total === 0) {
        current = 1
    }
    else if (available_pages < current){
        filterCallback({current: available_pages, pageSize: 10});
        return;
    }
    // Continue
    return {
        pageSize: pager.pageSize,
        current: current,
        total: total
    };
}