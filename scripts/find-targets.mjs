import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function findTargetProducts() {
  const targets = [
    'Chicken Popcorn',
    'Chicken Lollipop',
    'Chicken 65',
    'Chicken Wings'
  ]
  
  const { data: products, error } = await supabase
    .from('products')
    .select('id, name, image, category_id')

  if (error) {
    console.error('Error:', error)
    return
  }

  const found = products.filter(p => 
    targets.some(t => p.name.includes(t))
  )

  console.log(JSON.stringify(found, null, 2))
}

findTargetProducts()
