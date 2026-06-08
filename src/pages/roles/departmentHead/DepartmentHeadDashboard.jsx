import React from 'react';
import RoleDashboardView from '../shared/RoleDashboardView';

const DepartmentHeadDashboard = (props) => (
  <RoleDashboardView
    {...props}
    title="Студенты кафедры"
    subtitle={props.currentUser?.scopeName}
    showDepartment={false}
    showBankColumns={false}
    showGpaColumn
  />
);

export default DepartmentHeadDashboard;
