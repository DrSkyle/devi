export const rootClasses = (sectionKey, node) => {
  const type = node.props.type
  const classConfig = {
    outer: 'mb-5',
    label: 'block mb-1 font-bold text-sm text-white',
    inner:
      'max-w-md border border-gray-400 rounded-lg mb-1 overflow-hidden focus-within:border-blue-500',
    input: 'w-full h-10 px-3 border-none text-base text-gray-700 placeholder-gray-400',
    help: 'text-xs text-gray-500',
    messages: 'list-none p-0 mt-1 mb-0',
    message: 'text-red-500 mb-1 text-xs',
  }

  if (type === 'submit') {
    classConfig.outer = 'mb-0'
    classConfig.input =
      'bg-blue-500 text-white active:bg-blue-600 font-bold uppercase text-sm px-6 py-3 rounded shadow hover:shadow-lg outline-none focus:outline-none mr-1 mb-1 ease-linear transition-all duration-150'
  }

  return classConfig[sectionKey]
}
