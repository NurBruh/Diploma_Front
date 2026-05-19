import React from 'react';
import RoleDashboardView from '../shared/RoleDashboardView';

const InstituteDirectorDashboard = (props) => (
  <RoleDashboardView
    {...props}
    title="Студенты института"
    subtitle={props.currentUser?.scopeName}
    showBankColumns
  />
);

export default InstituteDirectorDashboard;
