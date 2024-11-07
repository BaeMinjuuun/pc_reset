// 해당 pc 의 그룹 계층 구조를 찾아 반환하는 함수
export const findGroupHierarchy = (groupId, groupData) => {
  const group = groupData.find((g) => g.id === groupId);
  if (!group) return "";
  if (!group.parent_id) return group.name; // 최상위 부모 그룹

  // 부모 그룹을 재귀적으로 찾음
  const parentHierarchy = findGroupHierarchy(group.parent_id, groupData);
  return `${parentHierarchy} > ${group.name}`; // 부모 이름 > 현재 그룹 이름 형식으로 반환
};
