import React from "react";
import { WarningOutlined } from '@ant-design/icons'

export function Warning() {
	return <div className="warning">
		<i>
			<WarningOutlined />
		</i>
		<p>
			머리와 어깨가 화면에 보여지고 있지 않습니다!
        </p>
	</div>;
}
