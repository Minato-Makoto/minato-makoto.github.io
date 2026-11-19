# Bàn giao Gemini 4 Neon · Sửa portfolio trước vòng thiết kế

## Tái kiểm sau lượt Gemini Neon · 19/11/2026

**Kết luận.** Bản trong workspace đã qua build và kiểm tra dữ liệu. Trước vòng giao diện, cần sửa trường hợp khung mở thêm lúc đến trạm, cách Bản đồ chọn nhãn khi dùng bàn phím và cách Git bảo toàn file legacy trên Windows. Các mục dưới ghi kết quả sau lượt thi công. Phần brief và bằng chứng trước lượt thi công được giữ bên dưới để đối chiếu.

| Mức | Phát hiện còn mở | Cách đóng |
| --- | --- | --- |
| P2 · HUD khi cuộn | Khi thẻ đích trượt vào dưới con trỏ đứng yên, `triggerStationArrival` bỏ `data-stage-moving` và thêm `is-arrived`. Ngay lúc đó selector Journey `.is-arrived:hover` bắt đầu đổi inset lớp lưng, đẩy khung theo Z và tăng góc lên 26 px. Góc quay chung đã ổn định nhưng nhánh CSS này vẫn cho phép đổi hình đúng lúc dừng. [Scene](../assets/js/scene-engine.js#L946) · [CSS](../assets/css/stage-nodes.css#L1090) | Để trạng thái đến trạm và hover trong Journey giữ nguyên hình học. Người thật cuộn đến cùng trạm hai lần, một lần đặt chuột nơi thẻ sẽ tới, một lần đặt ngoài thẻ. Cả hai lần khung phải dừng liền mạch. |
| P2 · Checkout Windows mới | Với cấu hình thực tế trên máy `core.autocrlf=true`, clone sạch của snapshot đổi xuống dòng ở 6 file legacy. Build đạt nhưng verifier dừng ở `mobile.html` với 32.723 byte thay vì 32.343. [Verifier](../scripts/verify-build.mjs#L457) | Đặt thuộc tính Git `legacy/** -text` cho các file cần giữ nguyên byte. Giữ nguyên hash chuẩn. Chạy lại build và verify trong clone mới với cả hai chế độ checkout. |
| P2 · Nhãn khi dùng Tab | Khi chuột nằm trên A và focus chuyển sang B, handler focus chọn B nhưng vòng render tiếp theo lại ưu tiên A. Nếu nhãn B bị ẩn vì va chạm, người dùng bàn phím có thể không đọc được tên B. Tên đầy đủ còn bị gõ lại trong 420 ms dù brief yêu cầu chữ tĩnh. [Chọn nhãn](../assets/js/scene-engine.js#L1680) · [Hiện tên](../assets/js/scene-engine.js#L527) | Đồng bộ một node ưu tiên theo cách tương tác gần nhất hoặc theo focus bàn phím đang hiện. Dùng cùng node cho nhãn và dây. Hiện ngay tên đầy đủ. Người thật để chuột trên A rồi Tab tới B trong vùng nhãn dày. |
| P2 · Back/Forward | Khi trở về một permalink bằng history, `applyHistoryLocation` truyền `none`. `syncLocationUrl` thoát trước khi cập nhật `document.title`, nên ứng dụng bỏ bước đồng bộ tiêu đề tab theo trạm khôi phục. [Điều hướng](../assets/js/scene-engine.js#L144) | Cập nhật tiêu đề cho trạng thái vừa khôi phục, chỉ bỏ bước ghi history. Đối chiếu tiêu đề, URL và Witness khi quay lại và đi tiếp giữa hai tác phẩm. |
| P3 · Đổi theme | Kích thước thẻ nằm ở token CSS 690 × 444, nhưng nhãn và vùng tránh chồng dùng bản sao 345, 222 và điểm neo −236 trong JS. Sửa kích thước thẻ trong theme sẽ làm lệch nhãn và vùng tránh chồng. [Token](../assets/css/tokens.css#L34) · [Phép chiếu](../assets/js/scene-engine.js#L26) | Dùng kích thước thực của thẻ làm nguồn chung, đọc lại khi kích thước thay đổi. Giữ phép chiếu hiện có. |

**Những mục của brief đã được xử lý.** Đã có chuyển tài liệu thật khi mở bookmark cũ ở fallback, đường khởi tạo gắn một player vào trang phim truy cập trực tiếp, chặn wheel bị clamp trước khi ẩn dây, và tách kaomoji khỏi văn bản biên tập. Bản đồ có lớp nhãn riêng, ẩn trong Journey, kèm danh sách tên cho màn hình hẹp. Số trang `VideoObject` được suy từ catalog. Các kết luận về luồng giao diện ở đây dựa trên mã và HTML sinh ra.

**Kiểm tra đã thực chạy.** Trên working tree, `npm run build` và `npm run verify` đạt với 13 node, 5 VideoObject, 15 URL sitemap, 617 tham chiếu nội bộ, 10 file legacy khớp byte và 22 phép kiểm HTTP. Tạo riêng snapshot chứa cả file chưa commit rồi clone depth 1. Với `core.autocrlf=false`, cài từ lockfile, build và verify đều đạt ở chế độ SHA-256, không cần commit legacy. Với `true`, lỗi kích thước ở trên tái hiện. Trong bản sao thử riêng, cấp đủ metadata mẫu cho một phim Drive hiện có và bật xuất schema, build và verify cùng đạt với 6 VideoObject. Dữ liệu thật giữ nguyên. Độ mượt, độ dễ đọc trên thiết bị và phát video thực tế chờ người thật xác nhận.

## Brief gốc và mốc trước thi công

Phạm vi là working tree của nhánh `codex/portfolio-rebuild`, HEAD `b0da152`, gồm cả phần Gemini sửa và các file mới chưa commit. Đối chiếu với hai brief của dự án. Kết luận dựa trên đọc mã, build tĩnh, kiểm tra dữ liệu và HTTP.

## Nhiệm vụ dành cho Gemini

Hãy đọc [plan nền tảng đã được Claude chỉnh](portfolio-foundation-plan.md), [plan tinh chỉnh](portfolio-micro-plan.md) và file này trước khi sửa. Vòng này giao trực tiếp cho **Gemini 4 Neon**. Google công bố Neon ngày 18/11/2026 và mô tả khả năng lần theo lỗi qua nhiều file, refactor có mục tiêu. Chọn Neon trực tiếp nếu dùng Antigravity để chính Neon thi công. Mức High mặc định phù hợp cho lượt đầu. Nếu hai đường điều hướng cho kết quả trái nhau, có thể dùng Extra để truy nguyên. [Google giới thiệu Neon](https://blog.google/innovation-and-ai/models-and-research/gemini-models/introducing-gemini-4-neon/) · [Các chế độ chạy](https://antigravity.google/docs/models)

1. **Research trước khi sửa.** Đọc diff, cả file mới chưa vào Git, rồi truy hai luồng click và cuộn từ input tới camera, lớp CSS của node, dây và nội dung Witness. So với mã CSS3DRenderer đang vendored và ví dụ gắn nhãn của Three.js đúng tag r128. Với CI và trang xem phim, tra tài liệu checkout và Google Video SEO ở các mục bên dưới. Ghi ngắn nguồn đã đọc, điều học được và quyết định áp dụng trước bản sửa đầu tiên. [CSS3DRenderer r128](https://github.com/mrdoob/three.js/blob/r128/examples/js/renderers/CSS3DRenderer.js) · [Ví dụ nhãn 2D gắn vào vật thể](https://github.com/mrdoob/three.js/blob/r128/examples/css2d_label.html) · [actions/checkout v4](https://github.com/actions/checkout/tree/v4)
2. **Tận dụng code đang chạy.** Được đọc ngược cách ví dụ upstream tính vị trí nhãn qua camera và tùy biến phần cần thiết vào scene hiện có. Ưu tiên hàm sẵn có trong repo. Nếu mang mã về, ghi file nguồn, tag/commit, giấy phép, phần đã đổi vào [thông tin mã bên thứ ba](../THIRD_PARTY_NOTICES.md). Ví dụ dùng renderer riêng vẫn có thể chỉ lấy phép chiếu nếu đủ cho site.
3. **Tự rà lại phần Gemini đã viết.** Kiểm từng phát hiện với working tree tại thời điểm nhận việc. Nếu mã đã thay đổi, dẫn file/hàm và kết quả kiểm chứng rồi đánh dấu mục đã xử lý. Sửa CI trước để có mốc kiểm tra đáng tin, tiếp theo xử lý nhịp đến trạm cùng dây nối, tên trên Bản đồ và các mục còn lại trong bảng. Có thể gộp code trùng ngay tại luồng liên quan. Giữ dữ liệu tác phẩm trong catalog, style ở lớp giao diện, scene và phím/cuộn trong portfolio. Layout chung phải tiếp tục dùng được cho intro hoặc bài news. Việc xây các trang đó và phát hành thuộc vòng sau.

## Hai thay đổi Minato-sama cần nhìn thấy

### 1. Cuộn đến trạm mà khung node vẫn chuyển động liền mạch

**Hiện tượng do Minato-sama ghi nhận.** Khi cuộn đến một trạm, HUD của node có thêm một nhịp giật như tự đổi hình ngay lúc dừng. Đây là lỗi của thẻ tác phẩm nhìn thấy trên màn hình. Phải đánh giá riêng thẻ và dây để tránh sửa hoạt ảnh oval rồi bỏ sót phần khung.

**Đầu mối trong mã.** Khi click, `goToStation` biết đích từ đầu. Khi cuộn, `tick` hoặc timer snap gọi `commitFreeScrollArrival` ở cuối hành trình. Lúc đó `syncJourneyNodeStates` mới đặt góc đích của thẻ thành `0.12` và bật `is-active`; cùng lượt, chữ chạy hiệu ứng lại và panel Witness nhận nội dung mới. CSS của `.hud-node.is-active` mở rộng lớp lưng, đổi inset của khung, kích thước các góc và đẩy lớp trước ra theo trục Z. Đây là các thay đổi thật trong mã; tác nhân gây nhịp giật trên thiết bị của chủ site vẫn cần được phân biệt. [Luồng điều hướng và render](../assets/js/scene-engine.js) · [Hình học của khung](../assets/css/stage-nodes.css) · [Hiệu ứng chữ](../assets/js/text-fx.js)

**Sửa ở thời điểm chuyển trạng thái.** Đối chiếu trạng thái lúc bắt đầu tiến vào trạm, ngay trước khi snap kết thúc và khi xác nhận đến nơi. Nếu khung chỉ bắt đầu mở sau khi camera dừng, đưa khung về hình học đích trong lúc camera còn tiến vào, hoặc giữ biên dạng ổn định và chỉ nhấn màu khi đến. Để xác nhận đến trạm cập nhật URL, nội dung và dây đúng một lần. Xử lý đổi đích giữa chừng và cuộn ngược để không kích hoạt nhầm thẻ vừa đi qua. Giữ oval vẽ dây một lượt khi đến đích mới; dây cũ biến mất ngay khi thực sự rời trạm. Tránh thêm timeout để che nhịp giật.

**Người thật nghiệm thu.** Cuộn chậm tới trạm kế, cuộn nhanh qua vài trạm rồi thả, đổi hướng trước khi dừng, sau đó click chọn cùng trạm để so. Đạt khi viền, góc, hình và chữ đứng đúng vị trí lúc máy quay dừng, không có nhịp nảy hoặc mở khung lần hai; dây chạm đúng node mới. Cuộn tiếp ở trạm cuối giữ nguyên khung và dây.

### 2. Đọc được tên ngay dưới node trên Bản đồ trang chủ

Ở `OVERVIEW`, thẻ có scale `0.26`. Tiêu đề hiện nằm trong `.node-caption-deck` và thu nhỏ cùng poster. Lấy tên từ `node.title` trong [catalog](../_data/catalog.json). Thêm nhãn ngay dưới mép thẻ, chữ tĩnh có dấu tiếng Việt và kích thước đọc được theo màn hình. Tận dụng phép chiếu camera trong scene hoặc lớp nhãn HTML mỏng ở Bản đồ. Giữ nhãn ngoài phần khung được đo cho animation và dây. [Nơi dựng thẻ và cập nhật Bản đồ](../assets/js/scene-engine.js)

Ưu tiên hiện tên ngay từ đầu ở những vị trí đủ trống. Khi hai nhãn đè nhau, ưu tiên node đang hover hoặc nhận focus và cho đọc trọn tên ấy. Ở màn hình cảm ứng có Bản đồ, khách cũng cần nhận diện được tác phẩm **trước** khi mở. Có thể dùng danh sách tên sẵn có nếu các nhãn thực sự quá dày. Giữ một lần chạm để mở, một điểm Tab cho mỗi node, và lớp nhãn không chặn click. Chỉ bật trong chế độ Bản đồ của trang chính; chuyển sang Journey phải ẩn ngay và quay về Bản đồ phải thấy lại.

**Người thật nghiệm thu.** Trên Bản đồ, tìm một tác phẩm theo tên, thử một tên dài ở vùng có hai node sát nhau, đổi kích thước cửa sổ, dùng Tab rồi dùng màn cảm ứng nếu có. Đạt khi biết mình sắp mở tác phẩm nào, tên không che poster hoặc thẻ kế bên và không xuất hiện dưới node trong Journey hay trang tác phẩm. Gemini được chọn cách tránh chồng chữ phù hợp thực tế và ghi lại lựa chọn.

## Sáu phát hiện từ lần audit trước

| Ưu tiên | Vấn đề và bằng chứng | Hướng sửa và điều kiện đóng |
| --- | --- | --- |
| P1 · CI | Workflow dùng checkout mặc định. Verifier gọi `git cat-file blob 63464e5:<path>` để so 10 file legacy. Trong clone một nhánh với depth 1, phép tra `63464e5:mobile.html` trả exit 128. Commit cũ cũng không phải tổ tiên của HEAD rebuild. | Lưu SHA-256 chuẩn của 10 file vào verifier hoặc fetch rõ commit chuẩn trong workflow. Kiểm tra lại từ một checkout nông độc lập. [Verifier](../scripts/verify-build.mjs) · [Workflow](../.github/workflows/build-portfolio.yml) |
| P2 · Bookmark cũ khi WebGL lỗi | Với `/#all/harmony-card`, server trả HTML trang chủ. `enableHtmlFallback` gọi `syncLocationUrl('replace')`, chỉ đổi history và title sang Harmony. HTML đang đọc vẫn là trang chủ cho tới khi reload. | Ở chế độ HTML, khi bookmark chỉ sang tài liệu khác, dùng `location.replace` tới permalink tĩnh. Nếu đã ở đúng tài liệu, chỉ dọn hash. [Scene](../assets/js/scene-engine.js) |
| P2 · Trang xem video | HTML trực tiếp có iframe. Ngay khi WebGL khởi tạo thành công, scene gỡ iframe đó. Player mới chỉ xuất hiện sau thao tác mở video. Với trang nhắm tới kết quả video, lượt truy cập chạy JS mất player chính sau render dù JSON-LD vẫn khai báo video. Chưa xác minh kết quả index thực tế trong Search Console. | Trên URL xem phim, giữ một player nổi bật qua bước nâng cấp sang 3D hoặc dùng trang xem tĩnh và cho khách chủ động vào Journey. Kiểm tra vẫn chỉ có một player. [Mã khởi động](../assets/js/scene-engine.js) · [Google Video SEO](https://developers.google.com/search/docs/appearance/video) |
| P2 · Dây nối | Handler wheel ẩn ngay dây trước khi tính đích mới. Ở trạm 12, cuộn tiếp xuống bị clamp về đúng trạm 12. Timer snap vẫn gọi lại kết nối và phát lại oval dù không hề rời trạm. Wheel có deltaY bằng 0 cũng đi vào nhánh này khi đang trong Journey. | So sánh đích sau clamp trước khi ẩn dây hoặc đặt trạng thái đang cuộn. Người thật kiểm tại trạm cuối rồi cuộn ngược thực sự sang trạm 11. [Handler wheel](../assets/js/scene-engine.js) |
| P2 · Lời Witness | Kaomoji nằm ngay trong chuỗi `greeting`, `roleDetail`, `techDetail`. HTML Harmony thực tế in cùng khuôn mặt trong cả bong bóng và phần mô tả bài. JS chia cả câu thành grapheme rồi gõ từng phần, nên khuôn mặt gồm nhiều ký tự cũng bị gõ dở. | Đặt biểu cảm ở dữ liệu hội thoại, ghép nguyên cụm vào riêng bong bóng ở cuối câu hoặc khi skip. Bài và metadata tiếp tục lấy văn bản thuần. [Template](../_includes/layouts/portfolio.njk) · [Controller](../assets/js/subhud-controller.js) |
| P3 · Mở rộng SEO video | Verifier kiểm điều kiện của từng video rồi lại đòi đúng 5 trang `VideoObject`. Khi một phim Drive có đủ metadata và được bật xuất, CI sẽ báo lỗi chỉ vì số lượng tăng. | Suy ra số trang từ các bản ghi đủ điều kiện, vẫn kiểm schema của từng trang và đối chiếu các trường bắt buộc. [Verifier](../scripts/verify-build.mjs) |

## Bằng chứng đạt

Các kết quả dưới đây là mốc **trước bản sửa**. Khi bàn giao, chạy lại `npm run build` và `npm run verify`, kèm phép kiểm CI checkout nông ở mục P1. Dùng kiểm tra cơ bản về cú pháp, dữ liệu, HTML sinh ra và HTTP. Toàn bộ thử thao tác, chuyển động, độ dễ đọc và trải nghiệm trên thiết bị do người thật thực hiện. Không chạy browser agent, E2E hoặc mô phỏng cuộn, click, touch và bàn phím.

- `npm run build` và `npm run verify` cùng thành công trên checkout hiện có. Kết quả gồm 13 trạm, 15 URL sitemap, 617 tham chiếu nội bộ, 10 file legacy khớp byte và 22 phép kiểm HTTP.
- Build độc lập trong thư mục tạm với một trang news dùng layout chung cho đúng canonical, có URL trong sitemap và không nạp Three.js hay scene. Trang mẫu chỉ dùng cho audit.
- URL Google Fonts lấy nguyên từ HTML build trả HTTP 200 với Be Vietnam Pro, Newsreader và IBM Plex Mono. Font tiếng Việt đã được nối vào bản build.
- Dây dùng chung một hàm khởi tạo và một tiến độ để vẽ đường cong và đầu oval. Khả năng hiển thị dấu trên thiết bị, nhịp nối khi click/cuộn và quyền xem các video bên ngoài vẫn thuộc phần người thật nghiệm thu.

## Khi Gemini bàn giao

Trả lời bằng tiếng Việt, ghi đường dẫn bản chạy cục bộ, nguyên nhân tìm được của nhịp giật, phương án nhãn đã chọn và nguồn code thực sự dùng. Với từng mục audit, ghi file đã sửa hoặc bằng chứng mục đó đã được xử lý trước lượt này. Ghi kết quả lệnh thực chạy và tách các ca cần Minato-sama trải nghiệm trên trình duyệt. Nếu chỉ suy ra hiệu quả từ mã, ghi rõ “chờ người thật xác nhận”.
