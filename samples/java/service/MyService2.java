@RestController
@RequestMapping("/ccc/")
public class AbcdController extends XXController {

  @Autowired
  private Xxx1 xxx1;

  /**
   * 查询所有
   * 
   * @return 
   */
   @GetMapping(value = "/findAll", ppp = PPPP.CC_C)
   public List<SomeCategory> findAll() 
  {
    return xxx;
  }

  /**
   * 通过竹简查询
   * 
   * @param id
   * @return
   */
   @GetMapping(value = "/queryById/{id}", ppp = PPPP)
   public BasicInfo findById(@PathVariable Integer id) 
  {
    return xxx;
  }

  /**
   * 查询我的
   * 
   * @param code 系统标识
   * @param info 查询条件
   * @return 分页数据
   */
   @GetMapping(value = "/myList", ppp = PPPP)
   public PageInfo<BasicInfo> myList(@RequestHeader("code") String code, MyInfo info) 
  {
    return xxx;
  }
  
   @GetMapping("/foofoo")
   public String download(@RequestHeader("code") String code,
       @RequestParam("type") String type,
       @RequestParam("ids") List<Integet> ids,
       MyInfo info) 
  {
    return xxx;
  }

  /**
   * 注册
   * 
   * @param info
   * @return 
   */
   @PostMapping(value = "/register/{id}", ppp = PPPP)
   public Map<String, Object> register(@RequestBody MyInfo info) 
  {
    return xxx;
  }
  
  /**
   * foo.bar,. 
   * 
   * @param someCategory 
   * @return 
   */
   @PostMapping(value = "/insert", ppp = PPPP.CC_C)
   public Integer insert(@RequestBody SomeCategory someCategory, Color color) 
  {
    return xxx;
  }
}
