export const reorderArray = (
  array: { id: string }[],
  currentId: string,
  newIndex: number
) => {
  const newArr = array.map((e) => e);
  const currentIndex = newArr.findIndex((obj) => obj.id === currentId);

  if (currentIndex === -1 || newIndex < 0 || newIndex >= newArr.length) {
    return newArr;
  }

  const [obj] = newArr.splice(currentIndex, 1);

  if (obj) newArr.splice(newIndex, 0, obj);

  return newArr;
};
