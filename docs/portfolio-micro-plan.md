# Vòng tinh chỉnh portfolio cho Gemini

Áp dụng trên bản Eleventy và giao diện 3D đang có trong working tree của nhánh `codex/portfolio-rebuild`. [Brief nền tảng đã được Claude điều chỉnh](portfolio-foundation-plan.md) vẫn là chuẩn cho 13 trạm, URL, history, SEO, Analytics, HTML dự phòng và các trang legacy. Thứ tự thi công là tách phần dùng chung của site, đặt font tiếng Việt tại đó, rồi tinh chỉnh dây, lời Witness và code trùng trong portfolio. Nội dung intro, blog/news mới, thiết kế mobile và phát hành có mốc riêng.

## Làm trước · Nền dùng chung cho intro, portfolio và bài viết

**Kết quả rà lại ngày 18/11/2026.** Layout hiện tại lấy canonical `/` và schema trang chủ mỗi khi thiếu `node`, đồng thời luôn nạp 7 script gồm Three.js, catalog, Witness và scene. CSS nền đặt `overflow: hidden` và `user-select: none` trên cả `html, body`. Riêng 404 phải khai trạng thái fallback và nạp CSS của HUD để đọc như trang thường. Dùng layout này làm mẫu cho một bài news sẽ kéo theo cả cơ chế chọn trạm, xử lý phím/cuộn và metadata dành cho portfolio. [Layout portfolio](../_includes/layouts/portfolio.njk) · [CSS nền](../assets/css/tokens.css) · [CSS fallback](../assets/css/chrome-hud.css) · [Trang 404](../content/404.njk)

| Phần | Gemini cần làm trong vòng này |
| --- | --- |
| Khung HTML chung | Dùng layout cha của Eleventy cho `lang`, charset, viewport, font, favicon, Analytics và vị trí chèn nội dung. Trang con cung cấp tiêu đề, mô tả, canonical và schema phù hợp khi cần. Metadata chung có thể đọc thông tin site hiện có. Một trang mới chỉ cần permalink, tiêu đề và nội dung để có trang HTML đọc được, cuộn được và chọn được chữ. [Eleventy layouts](https://www.11ty.dev/docs/layouts/) |
| Portfolio 3D | Đặt scene, HUD, WebGL/CSS3D, catalog phía trình duyệt, hiệu ứng chữ và xử lý history/phím/cuộn trong layout portfolio. Chỉ khóa cuộn khi scene 3D hoạt động. Link từ portfolio tới intro, blog, news hoặc bài viết dùng liên kết HTML thật; router trạm chỉ xử lý Overview và URL tác phẩm thuộc phạm vi của nó. |
| Trang thứ hai để kiểm chứng | Chuyển trang 404 hiện có sang layout chung. Giữ HTTP 404, `noindex`, liên kết trợ giúp và Analytics. HTML build của 404 không chứa canonical, schema trang chủ, HUD, catalog JS, Three.js hay scene; đọc trang không cần CSS của sân khấu. Đây là ví dụ thực để người viết intro hoặc bài đầu tiên có thể làm theo. |
| URL và sitemap | Hiện `/` do Overview sở hữu, `/blog/` do tệp legacy được chép nguyên byte và `/mobile.html` đã có hợp đồng riêng. Giữ các đích này cho đến khi chủ site chốt vị trí intro và lịch thay blog. Mỗi URL chỉ có một nguồn xuất bản. Cho sitemap nhận các trang nội dung công khai từ Eleventy, hợp với 13 permalink của catalog và blog legacy đúng một lần. Các trang tác phẩm đang bị loại khỏi collections, nên chuyển sang lặp `collections.all` đơn thuần sẽ làm sót tác phẩm. [Cấu hình copy](../eleventy.config.mjs) · [Nguồn trang tác phẩm](../content/work-pages.njk) · [Sitemap](../content/sitemap.xml.njk) |

**Nghiệm thu khả năng mở rộng.** Kiểm tra HTML build sẵn của 404 và một trang tác phẩm để chứng minh hai layout nhận đúng tài nguyên và metadata. Cập nhật bộ verify hiện đang so sitemap với đúng một danh sách theo thứ tự và chỉ duyệt các trang đã liệt kê. Kiểm tra URL canonical có tệp thật, mỗi URL xuất hiện một lần, đủ các đường dẫn đã cam kết, bỏ 404 và bản mobile trùng canonical. Cho phép `lastmod` ở trang có ngày cập nhật nội dung đáng tin. Lúc thêm bài thật đầu tiên, tác giả chỉ khai nội dung và metadata của bài; permalink, link nội bộ và sitemap phải hoạt động mà không sửa scene, catalog tác phẩm hoặc danh sách URL trong bộ verify. [Bộ kiểm tra hiện tại](../scripts/verify-build.mjs)

## Typography · Đổi font và kiểm tra dấu tiếng Việt

Ở bản hiện hành, Syne dùng cho lời Witness và tiêu đề tác phẩm; Instrument Serif Italic dùng cho tên ở header. Kiểm tra bảng ký tự Unicode trong các tệp font chính thức cho thấy cả hai chỉ có **50/146** ký tự của bộ thử gồm 12 nguyên âm Việt, mỗi nguyên âm có sáu dạng thanh, cả hoa lẫn thường, cộng Đ và đ. Cùng thiếu `ơ, ư, ả, ễ, ộ, ừ, ỵ`. IBM Plex Mono Regular hiện có đủ 146. Kết quả xác nhận thiếu glyph ở hai font đầu; tình trạng dấu bị cắt trong một khung chữ phải xem riêng trên bản hiển thị. [Syne](https://github.com/google/fonts/tree/main/ofl/syne) · [Instrument Serif](https://github.com/google/fonts/tree/main/ofl/instrumentserif) · [IBM Plex Mono](https://github.com/google/fonts/tree/main/ofl/ibmplexmono)

- Đổi nội dung, lời Witness, menu và nút sang **Be Vietnam Pro**. Dùng **Newsreader** cho tên tác giả và tiêu đề có chất điện ảnh hoặc biên tập. Be Vietnam Pro Regular/SemiBold và Newsreader bản đứng/nghiêng đều có đủ **146/146** ký tự trong cùng phép thử. Đây là cặp đề xuất cho Gemini triển khai. [Be Vietnam Pro](https://github.com/google/fonts/tree/main/ofl/bevietnampro) · [Newsreader](https://github.com/google/fonts/tree/main/ofl/newsreader)
- Nạp các kiểu chữ thực sự dùng tại head chung với `display=swap`. Đặt font thân bài và font tiêu đề bằng token dùng chung, có `system-ui` và `Georgia, serif` dự phòng. Áp dụng cho phần 3D, HTML đọc dự phòng và 404. Rà cả khai báo font trong SVG nếu chữ đó còn hiện sau vòng bỏ tọa độ. Blog/mobile đang được bảo toàn theo byte sẽ nhận typography mới khi đến bước chuyển giao giao diện tương ứng.
- Người thật đọc “Lương Bảo Huy”, “Nguyễn”, “Phòng ngừa đột quỵ” ở tiêu đề, dòng in nghiêng, nút hẹp và trong chat khi chữ đang hiện dần. Kiểm tra dấu kép có đủ khoảng phía trên/dưới và tên không bị cắt khi xuống dòng. Với văn bản có dấu tổ hợp, hiệu ứng gõ cần hiện trọn cụm chữ. Kiểm tra cả các ký hiệu thực tế trong kaomoji bằng font dự phòng của thiết bị.

## 1. Một lần nối dây cho mỗi lần tới trạm

**Kết quả người xem cần thấy.** Vừa rời tác phẩm A, dây A biến mất ngay. Khi thẻ tác phẩm B xuất hiện ở trạm đích, oval bắt đầu tại cổng của thẻ và chạy một lượt về phía bảng Witness. Dây hiện đến đúng vị trí oval vừa đi qua. Khi oval chạm cổng Witness, oval kết thúc và dây hoàn chỉnh nằm yên, hai đầu tiếp tục bám vào thẻ và bảng nếu chúng dịch chuyển.

Trong mã hiện tại, click chọn đích ở `goToStation`, còn cuộn xác nhận đích ở `commitFreeScrollArrival`. Đây là hai thời điểm hợp lý theo brief Claude. Hàm `updateScreenTether` đặt cả đường cong lên màn hình ngay, cho oval chạy theo đồng hồ toàn trang và đổi nhánh ở Overview theo chu kỳ. CSS còn chạy nét đứt vô hạn. Vì vậy cùng một trạm có thể bắt đầu từ những vị trí oval khác nhau. Đây là nhận định từ mã và hiện tượng chủ site mô tả. [Mã điều hướng và dây](../assets/js/scene-engine.js) · [CSS của dây](../assets/css/stage-nodes.css)

| Thời điểm | Yêu cầu cho Gemini |
| --- | --- |
| Bắt đầu rời trạm | Ẩn ngay toàn bộ dây cũ, kể cả nét nền, vệt sáng và oval. Khi khách cuộn tiếp qua nhiều trạm, giữ dây ẩn trong lúc di chuyển. Cuộn nội dung hồ sơ/chat vẫn là thao tác đọc. |
| Đích đã chốt và cổng thẻ mới đã hiện | Click thẻ, chọn từ Witness, nút trước/sau, cuộn dừng, mở URL trực tiếp và Back/Forward đều đi qua cùng một hàm bắt đầu nối. Chỉ nhánh điều hướng quyết định ID. Dây đọc ID đó và vị trí hai cổng. |
| Đang nối | Dùng lại oval, đường Bézier và vòng vẽ đang có. Một tiến độ cục bộ đi từ 0 đến 1 cho cả đầu dây lẫn oval. Dùng điểm cuối của chính đoạn cong đang hiển thị để đặt oval. Một giá trị thời lượng dùng chung trong mã là đủ. |
| Đổi đích giữa chừng hoặc đứng yên | Đích mới hủy lượt trước ngay. Chọn lại đúng trạm, di chuột hoặc resize chỉ cập nhật điểm neo. Nếu cuộn rời nhẹ rồi dừng lại ngay trạm cũ, khôi phục dây ở trạm đó, tránh trạng thái mất dây. |
| Quay về Bản đồ | Giữ sơ đồ 13 nhánh của Overview. Các nhánh nền biểu diễn vị trí. Khi thể hiện một kết nối đang nối, dùng cùng hiệu ứng trên nhánh đó. Bỏ vòng tự chuyển oval qua từng nhánh khi người xem đang đứng yên. |

**Khi người thật đối chiếu**, click từ 00 đến 06 và cuộn để dừng ở 06 phải cho cùng hướng chạy, nhịp và trạng thái kết thúc. Dây chỉ nối vào thẻ đích.

## 2. Để Witness dẫn đường bằng lời người xem hiểu ngay

Mượn cách kể của isekai có hệ thống và giao diện sci-fi. Witness dẫn đường, bản đồ chỉ vị trí và mỗi lựa chọn cho biết bước tiếp theo. Dùng chất này ở lời chào và chuyển trạm. Nút thao tác gọi đúng thứ người xem sắp mở. Có thể tham khảo bối cảnh thế giới trò chơi của *Log Horizon* và cách *Mass Effect* dùng bản đồ, nhật ký để người chơi tìm đường. [Giới thiệu của Yen Press](https://yenpress.com/titles/9781975309848-log-horizon-vol-1-light-novel) · [Sổ tay Mass Effect của EA](https://eaassets-a.akamaihd.net/eahelp/manuals/mass-effect-manuals_Microsoft%20XBOX360_en_US.pdf)

| Chữ hoặc vị trí hiện có | Hướng sửa |
| --- | --- |
| `FRAME // … · AZ …°`, `Z:-900m`, `FOCUS // …`, thước tọa độ và mã ID lộ ra trên trang đọc | Bỏ dòng chữ và chỗ trống nó chiếm. Thẻ đã có tên tác phẩm, năm và vai trò của Huy. Tọa độ nội bộ vẫn phục vụ việc dựng cảnh. |
| `Z-CORRIDOR // 13 NODES`, `OVERVIEW MODE`, `PREV / MAP / NEXT` | Dùng “Tác phẩm”, “Bản đồ”, “Trước”, “Tiếp” theo vị trí. Số thứ tự chỉ xuất hiện ở nơi giúp người xem định hướng. |
| Lời chào mở bằng thông số trạm hoặc nhắc lại tên đã hiện | Ở Bản đồ, Witness có thể hỏi “Mình là Witness. Bạn muốn xem một bộ phim hay tìm hiểu người đứng sau nó?” Ở Harmony, đi thẳng vào câu chuyện bằng “Với Harmony 2025, Huy phụ trách từ ý tưởng đến bản phim cuối cùng.” Giữ sự kiện và credit đã có trong catalog. |
| `DATA SHEET`, `STREAM`, `Role & Scope`, `Mở nguồn gốc` | Dùng các nhãn “Mở hồ sơ”, “Xem video”, “Vai trò của Huy”, “Xem trên YouTube” hoặc “Xem trên Google Drive”. Kênh liên hệ ghi “Gửi email” và “Gọi điện” theo đúng đích của link. |

Rà đủ lời dẫn trong [catalog](../_data/catalog.json), chữ vẽ thẳng vào [poster SVG](../assets/js/nodes-data.js), thẻ 3D trong scene, [nút và hội thoại](../assets/js/subhud-controller.js), [template HTML](../_includes/layouts/portfolio.njk) và [trang 404](../content/404.njk). Giữ tên phim, tên khách hàng, chức danh, năm, permalink và các thuật ngữ nghề nghiệp có ý nghĩa. Wording mới dùng cùng một giọng trong bản 3D và bản HTML. Khi sửa tiêu đề/mô tả chung của site, tiếp tục sinh metadata qua catalog hiện tại.

**Kaomoji trong câu trả lời theo kịch bản.** Khi viết lại, Gemini soạn kaomoji theo sắc thái của chính câu Witness nói. Áp dụng cho lời chào ở Bản đồ, lời mở từng trạm, câu trả lời về vai trò, hậu kỳ và liên hệ. Dùng cách biểu đạt chào đón khi mời khám phá, tập trung khi kể về nghề, thân thiện khi mời liên hệ; lượng và vị trí theo nhịp câu. Viết biểu cảm cùng lượt thoại để cùng một câu hiển thị nhất quán, kể cả khi khách bấm hiện hết chữ. Giữ đại từ dành cho khách xem site và giữ đủ nội dung nghề nghiệp.

Các trường `greeting`, `roleDetail`, `techDetail` còn được dùng làm nội dung bài, và schema có đường dự phòng đọc `greeting`. Giữ một bản văn gốc có thể tái sử dụng. Lưu biểu cảm đi kèm từng lời Witness trong dữ liệu hội thoại và chỉ ghép khi render bong bóng. Render lời chào HTML ban đầu và lời chạy bằng JS từ cùng dữ liệu; cho biểu cảm hiện nguyên cụm, một lần, kể cả khi bỏ qua typewriter. Nếu dùng một span trang trí, đặt `aria-hidden="true"` riêng trên span đó để trình đọc màn hình vẫn đọc nguyên câu. Nút, lời của khách, credits, title, description và JSON-LD tiếp tục lấy chữ thuần. Cách này dùng script tĩnh đã có, không cần bộ random biểu cảm hay gọi AI lúc người xem mở trang. [Bong bóng Witness](../assets/js/subhud-controller.js) · [Những vị trí dùng chung nội dung](../_includes/layouts/portfolio.njk) · [Schema](../eleventy.config.mjs)

## 3. Giản lược ở những chỗ đang làm cùng một việc hai lần

1. **Dây.** Sau khi hai luồng điều hướng dùng chung một lần nối, bỏ nhịp oval theo đồng hồ toàn trang, vòng nét đứt và phần comet cũ nếu đã hết chỗ dùng. Giữ tính toán vị trí cổng để dây bám đúng khi camera chuyển động. Dùng vòng vẽ sẵn có.
2. **Media.** Cả 11 video đã có `video.sourceUrl` và `video.embedUrl` phục vụ HTML và SEO. Player 3D vẫn phân tích lại `node.link` qua `videoLinkAndThumb`. Cho player và danh sách HTML đọc cùng hai trường trước, rồi bỏ parser và trường trùng khi đã rà hết nơi dùng. Giữ hành vi autoplay hiện có cho video YouTube do khách chủ động mở và giữ link xem gốc. [Dữ liệu hiển thị](../assets/js/nodes-data.js) · [Trang HTML](../_includes/layouts/portfolio.njk)
3. **Sub-HUD.** `runSubHudTransition` chỉ gọi callback ngay. Hai nơi gọi có thể cập nhật nội dung trực tiếp. Các nút Witness đang nhận cả callback theo index lẫn theo ID; giữ đường theo ID sau khi đối chiếu các nơi gọi thực tế. Dừng ở các phần trùng đã xác nhận. Rộng hơn thế sẽ biến một vòng chỉnh nhỏ thành thay kiến trúc.

Giữ Eleventy hiện tại với một build dependency. Các thay đổi trên nằm trong catalog, template, JS và CSS đang có, không cần bảng setting, file cấu hình chuyển động, thư viện animation hay framework mới.

## Bàn giao và nghiệm thu

Khi được giao thi công, Gemini chỉ kiểm tra cú pháp/build, dữ liệu và artifact tĩnh bằng các lệnh hiện có, gồm `npm run build` và `npm run verify`. Phần nhìn, thao tác và cảm nhận chuyển động để người thật xác nhận trên bản local.

- [ ] Click và cuộn tới cùng một tác phẩm. Dây cũ tắt ngay, dây mới chạy đúng một lượt sau oval và nằm yên.
- [ ] Chọn nhanh hai đích khi oval chưa tới nơi, cuộn qua nhiều trạm, thử Back/Forward rồi về Bản đồ. Chỉ đích cuối còn dây đang nối.
- [ ] Đọc và cuộn trong hồ sơ, di chuột và đổi kích thước cửa sổ. Dây bám đúng thẻ, hội thoại và media giữ đúng trạm.
- [ ] Nhờ một người chưa biết site tự tìm một tác phẩm, xem vai trò của Huy và mở video hoặc liên hệ. Ghi lại đúng cụm chữ khiến họ phải hỏi.
- [ ] Đọc 404 và trang tác phẩm trên desktop/mobile. Dấu tiếng Việt rõ ở cả chữ đứng, chữ nghiêng, chữ hoa và các dòng hẹp. Trên trang thường có thể cuộn và chọn chữ tự nhiên.
- [ ] Xem lời Witness khi mở trực tiếp một trạm, khi chuyển trạm, khi hỏi về vai trò/hậu kỳ và khi liên hệ. Lời thoại có kaomoji phù hợp, không chớp hoặc lặp lúc gõ xong hay bấm hiện hết. Đọc riêng phần mô tả tác phẩm để xác nhận giọng biên tập vẫn tự nhiên.
