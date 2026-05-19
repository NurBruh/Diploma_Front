import React from 'react';
import RoleDashboardView from '../shared/RoleDashboardView';

const InstituteDirectorDashboard = (props) => (
  <RoleDashboardView
    {...props}
    title="Дашборд института"
    subtitle={props.currentUser?.scopeName}
    showBankColumns
    groupKey="department"
    groupLabel="Кафедры института"
  />
);

export default InstituteDirectorDashboard;
