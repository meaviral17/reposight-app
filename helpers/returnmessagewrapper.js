const returnMessageWrapper = (status, data, error) => {
    return {status: status, data: data, error: error};
}

module.exports = {returnMessageWrapper};