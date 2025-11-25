import MapComponent from './MapComponent';

function App() {
  return (
    <div className="flex flex-col items-center justify-center p-4">
      <h1 className="text-3xl font-bold text-gray-800 mb-4">SafeWay 지도 테스트</h1>
      <MapComponent />
      <p className="mt-4">지도가 보이면 성공입니다.</p>
    </div>
  );
}

export default App;