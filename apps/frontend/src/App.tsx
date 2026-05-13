import { BrowserRouter, Route, Routes } from "react-router-dom";
import "./index.css";
import { Netrock } from "@/pages/netrock.tsx";
import Data from "./pages/data.tsx";

export function App() {
	return (
		<BrowserRouter>
			<Routes>
				<Route path="/" element={<div>Home</div>} />
				<Route path="/netrock" element={<Netrock />} />
				<Route path="/data" element={<Data />} />
			</Routes>
		</BrowserRouter>
	);
}
