import React from 'react';
import RoleDashboardView from '../shared/RoleDashboardView';

const DepartmentHeadDashboard = (props) => (
  <RoleDashboardView
    {...props}
    title="Дашборд кафедры"
    subtitle={props.currentUser?.scopeName}
    showBankColumns
    groupKey="profession"
    groupLabel="Образовательные программы"
  />
);

export default DepartmentHeadDashboard;
