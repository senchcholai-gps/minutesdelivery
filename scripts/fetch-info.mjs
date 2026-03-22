import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function fetchInfo() {
  const { data: catData } = await supabase.from('categories').select('*')
  const { data: prodData } = await supabase.from('products').select('*')

  console.log('--- CATEGORIES ---')
  console.log(JSON.stringify(catData, null, 2))
  console.log('--- PRODUCTS ---')
  console.log(JSON.stringify(prodData, null, 2))
}

fetchInfo()
