// Component import
import {ModelServerEvaluationWrapper} from './components/ModelServerEvaluation.js';
import React from 'react';
import {createRoot} from "react-dom/client";

const root = createRoot(document.getElementById('root') as HTMLElement);

root.render(<ModelServerEvaluationWrapper/>);