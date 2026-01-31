#!/bin/bash

# ============================================================================
# 批量获取物品详情脚本
# ============================================================================
# 使用方法：
# 1. 打开浏览器访问 https://wiki.skland.com/
# 2. 按F12打开开发者工具 -> Network标签
# 3. 刷新页面，找到任意 zonai.skland.com 请求
# 4. 右键 -> Copy -> Copy as cURL
# 5. 从cURL命令中复制以下三个header的值，填入下面的变量中
# 6. 运行此脚本: bash data/fetch_all_details.sh
# ============================================================================

# 【请填入】从浏览器复制的认证头（必填）
TIMESTAMP="1769743643"
SIGN="709a6201d6706874eb0ac0b95544afc1"
DID="BLO1Tzehfk0hCn4uXo/qc1c3n6jgzxIHH0rJecjwXyltbUuoeTlLz3BScmsN0AY1ZEgNbDC6McAeb/7P1/lYHgQ=="

VNAME="1.0.0"
PLATFORM="3"
CONTENT_TYPE="application/json"
USER_AGENT="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.2 Safari/605.1.15"

OUTPUT_DIR="data/item_details"
mkdir -p "$OUTPUT_DIR"

if [ "$TIMESTAMP" = "YOUR_TIMESTAMP_HERE" ] || [ "$SIGN" = "YOUR_SIGN_HERE" ] || [ "$DID" = "YOUR_DID_HERE" ]; then
    echo "错误: 请先编辑此脚本，填入从浏览器复制的认证头"
    echo ""
    echo "操作步骤："
    echo "1. 访问 https://wiki.skland.com/"
    echo "2. 打开开发者工具(F12) -> Network标签"
    echo "3. 找到任意 zonai.skland.com 的请求"
    echo "4. 查看Request Headers，复制以下三个值："
    echo "   - timestamp"
    echo "   - sign"
    echo "   - dId"
    echo "5. 填入本脚本开头的变量中"
    echo ""
    exit 1
fi

if [ ! -f "data/type5_devices.json" ] && [ ! -f "data/type6_items.json" ]; then
    echo "错误: 未找到catalog文件"
    echo "请先运行: python data/fetch.py"
    exit 1
fi

# 检查是否安装了jq（用于解析JSON）
if ! command -v jq &> /dev/null; then
    echo "警告: 未安装jq，将使用备用方法提取itemId"
    echo "建议安装jq: brew install jq  (macOS)"
    USE_JQ=false
else
    USE_JQ=true
fi

echo "正在提取物品ID列表..."
if [ "$USE_JQ" = true ]; then
    ITEM_IDS=$(cat data/type5_devices.json data/type6_items.json 2>/dev/null | jq -r '.[].itemId' | sort -u)
else
    # 备用方法：使用grep和sed
    ITEM_IDS=$(cat data/type5_devices.json data/type6_items.json 2>/dev/null | grep -o '"itemId": *"[^"]*"' | sed 's/"itemId": *"\([^"]*\)"/\1/' | sort -u)
fi

TOTAL=$(echo "$ITEM_IDS" | wc -l | tr -d ' ')
echo "找到 $TOTAL 个物品"
echo ""
echo "认证信息："
echo "  timestamp: $TIMESTAMP"
echo "  sign: ${SIGN:0:20}..."
echo "  dId: ${DID:0:20}..."
echo ""
echo "开始批量获取..."
echo ""

SUCCESS=0
SKIP=0
FAIL=0
CURRENT=0

for ITEM_ID in $ITEM_IDS; do
    CURRENT=$((CURRENT + 1))
    OUTPUT_FILE="$OUTPUT_DIR/${ITEM_ID}.json"
    
    if [ -f "$OUTPUT_FILE" ]; then
        SKIP=$((SKIP + 1))
        continue
    fi
    
    printf "[%d/%d] %s " "$CURRENT" "$TOTAL" "$ITEM_ID"
    
    HTTP_CODE=$(curl -s -w "%{http_code}" -o "$OUTPUT_FILE" \
        "https://zonai.skland.com/web/v1/wiki/item/info?id=${ITEM_ID}" \
        -X GET \
        -H "Content-Type: ${CONTENT_TYPE}" \
        -H "Accept: */*" \
        -H "Sec-Fetch-Site: same-site" \
        -H "Accept-Language: zh-CN,zh-Hans;q=0.9" \
        -H "Accept-Encoding: gzip, deflate, br" \
        -H "Sec-Fetch-Mode: cors" \
        -H "Origin: https://wiki.skland.com" \
        -H "User-Agent: ${USER_AGENT}" \
        -H "Referer: https://wiki.skland.com/" \
        -H "Sec-Fetch-Dest: empty" \
        -H "timestamp: ${TIMESTAMP}" \
        -H "platform: ${PLATFORM}" \
        -H "dId: ${DID}" \
        -H "vName: ${VNAME}" \
        -H "sign: ${SIGN}")
    
    if [ "$HTTP_CODE" = "200" ]; then
        if grep -q '"code":0' "$OUTPUT_FILE" 2>/dev/null; then
            SUCCESS=$((SUCCESS + 1))
            echo "✓"
        else
            ERROR_MSG=$(grep -o '"message":"[^"]*"' "$OUTPUT_FILE" 2>/dev/null | sed 's/"message":"\([^"]*\)"/\1/')
            FAIL=$((FAIL + 1))
            echo "✗ (${ERROR_MSG:-未知错误})"
            rm -f "$OUTPUT_FILE"
            
            # 如果是认证错误，停止执行
            if grep -q '"code":10001' "$OUTPUT_FILE" 2>/dev/null || grep -q '"code":10000' "$OUTPUT_FILE" 2>/dev/null; then
                echo ""
                echo "认证失败！请重新从浏览器获取认证头。"
                echo "已成功获取 $SUCCESS 个物品。"
                exit 1
            fi
        fi
    else
        FAIL=$((FAIL + 1))
        echo "✗ (HTTP $HTTP_CODE)"
        rm -f "$OUTPUT_FILE"
    fi
    
    # 延迟，避免请求过快
    sleep 0.2
done

echo ""
echo "============================================================================"
echo "完成！"
echo "- 成功: $SUCCESS 个"
echo "- 跳过(已存在): $SKIP 个"
echo "- 失败: $FAIL 个"
echo "- 保存至: $OUTPUT_DIR/"
echo "============================================================================"

if [ $FAIL -gt 0 ]; then
    echo ""
    echo "提示: 如有失败项，可重新获取认证头后再次运行此脚本。"
fi
