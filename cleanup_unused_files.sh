#!/bin/bash
echo "=== 清理无用文件 ==="

# 删除 web/public/data 下的过期文件
echo "清理 web/public/data/synthesis_tables/..."
rm -rf web/public/data/synthesis_tables

echo "清理 web/public/data/device_production_tables/..."
rm -rf web/public/data/device_production_tables

echo "清理 web/public/data/*.list.json..."
rm -f web/public/data/synthesis_tables_list.json
rm -f web/public/data/device_production_tables_list.json

echo "✓ 清理完成"

# 复制必要的文件到 web/public/data
echo ""
echo "复制必要的数据文件..."
cp data/recipe_database.json web/public/data/

echo "✓ 完成！"
