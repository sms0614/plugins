/**
 * 
 * ██████╗        █████╗ ██████╗ ██████╗ 
 * ╚════██╗      ██╔══██╗██╔══██╗██╔══██╗
 *  █████╔╝█████╗███████║██████╔╝██████╔╝
 *  ╚═══██╗╚════╝██╔══██║██╔═══╝ ██╔═══╝ 
 * ██████╔╝      ██║  ██║██║     ██║     
 * ╚═════╝       ╚═╝  ╚═╝╚═╝     ╚═╝     
 * 
 * @description Entry point for the application after Wrapper
 * @next last entry point
 */

import React from 'react';
import { useRecoilValue } from 'recoil';

//@midasit-dev/moaui
import {
	GuideBox,
	Panel,
	Button
} from "@midasit-dev/moaui";

//Components
import CompTimeHistory from './Components/TimeHistory';
import CompTHfunction from './Components/TimeHistoryFunction';
import CompStaticLoad from './Components/StaticLoad';
import CompAngleTable from './Components/AngleTable';

//Variables
import {
	VarTHloadcase,
	VarSTloadcase,
	VarTHfunction,
	VarScaleFactor,
	VarRowData
} from './Components/variables';

import {
	checkPyScriptReady,

} from './pyscript_utils';
import { useSnackbar } from 'notistack';
import { useTranslation } from 'react-i18next';

const deletePyscriptTerminalTag = () => {
	// Get all elements with the py-terminal tag
	const pyTerminals = document.querySelectorAll('py-terminal');

	// Remove all py-terminal elements
	pyTerminals.forEach(pyTerminal => {
		pyTerminal.remove();
	});
}

const App = () => {
	const { t:translate, i18n: internationalization} = useTranslation();
	//App이 마운트 되었을 때만 실행.
	React.useEffect(() => deletePyscriptTerminalTag(), []);

	//UI Values
	const TimeHistoryLC = useRecoilValue(VarTHloadcase);
	const StaticLoadLC = useRecoilValue(VarSTloadcase);
	const THfunction = useRecoilValue(VarTHfunction);
	const ScaleFactor = useRecoilValue(VarScaleFactor);
	const RowData = useRecoilValue(VarRowData);

	const createLoads = React.useCallback(() => {
		const jsoninput = {
			"TimeHistoryLC": TimeHistoryLC,
			"StaticLoadLC": StaticLoadLC,
			"THfunction": THfunction,
			"ScaleFactor": ScaleFactor,
			"RowData": RowData
		};

		// Time History Load Case가 선택되지 않았을 경우
		if (jsoninput["TimeHistoryLC"] === 0) {
			enqueueSnackbar(translate("THLoadCase_Select_Error"), { variant: "error" });
			return;
		}
		// Static Load Case가 선택되지 않았을 경우
		if (jsoninput["StaticLoadLC"] === 0) {
			enqueueSnackbar(translate("STLoadCase_Select_Error"), { variant: "error" });
			return;
		}
		// Scale Factor가 입력되지 않았을 경우
		if (jsoninput["ScaleFactor"] === "" || jsoninput["ScaleFactor"] === undefined || jsoninput["ScaleFactor"] === null || isNaN(+jsoninput["ScaleFactor"]) || +jsoninput["ScaleFactor"] <= 0) {
			enqueueSnackbar(translate("ScaleFactor_Input_Error"), { variant: "error" });
			return;
		}
		// Angle data가 입력되지 않았거나, 중복된 경우
		const rows = jsoninput["RowData"];
		const isDuplicate = (value: number) => rows.filter((row) => row.angle === value).length > 1;
		if (rows.length === 0) {
			enqueueSnackbar(translate("Angle_Input_Non_Error"), { variant: "error" });
			return;
		}
		for (const row of rows) {
			if (isDuplicate(row.angle)) {
				enqueueSnackbar(translate("Angle_Input_Error"), { variant: "error" });
				return;
			}
		}

		checkPyScriptReady(() => {
			const main_func = pyscript.interpreter.globals.get("main");
			const results = main_func(JSON.stringify(jsoninput));
			const paringResults = JSON.parse(results);
			if ('error' in paringResults) {
				enqueueSnackbar(`${paringResults["error"]}`, { variant: "error" });
				return;
			} 
			
			if (paringResults.hasOwnProperty("success")) {
				enqueueSnackbar(paringResults["success"], { variant: "success", autoHideDuration: 1500 });
				return;
			}

			enqueueSnackbar(translate("Unknown_Error"), { variant: "error" });
		});
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [RowData, ScaleFactor, StaticLoadLC, THfunction, TimeHistoryLC]);

	const { enqueueSnackbar } = useSnackbar();

	const [loading, setLoading] = React.useState(false);

	return (
		<GuideBox width={352} spacing={2} padding={2}>
			<Panel width="100%" variant='shadow2'>
				<GuideBox width='100%' padding={1} spacing={3}>
					{/** Top Panels */}
					<CompTimeHistory />
					<CompStaticLoad />
					<CompTHfunction />
					<CompAngleTable />
				</GuideBox>
			</Panel>
			<GuideBox width="100%" horRight>
				<Button 
					color='negative' 
					onClick={() => {
						setLoading(true);
						setTimeout(() => {
							try {
								createLoads();
							} catch (e: any) {
								console.error(e);
							} finally {
								setLoading(false); return;
							}
						}, 500);
					}}
					loading={loading}
				>
					{translate("Create_Button")}
				</Button>
			</GuideBox>
		</GuideBox>
	);
};

export default App;